import { z } from "zod";
import { textResult } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
import { DEFAULT_RAZORS, summarizeRazors } from "../lib/razors.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    observations: z.string(),
    k: z.number().int().min(2).max(10).default(4),
    apply_razors: z.array(z.string()).default([...DEFAULT_RAZORS]),
});
const inputSchema = InputSchema.shape;
const OutputSchema = z
    .object({
    hypotheses: z
        .array(z.object({
        id: z.string(),
        statement: z.string(),
        rationale: z.string(),
        scores: z.object({
            prior_plausibility: z.number(),
            explanatory_power: z.number(),
            simplicity_penalty: z.number(),
            testability: z.number(),
            overall: z.number(),
        }),
    }))
        .default([]),
    experiments_or_evidence: z.array(z.string()).default([]),
    notes: z.string().optional(),
})
    .extend({ meta: ReasoningMetadataSchema.optional() });
export function registerAbductive(server) {
    const handler = async (rawArgs, _extra) => {
        const { observations, k, apply_razors } = rawArgs;
        const prompt = `Observations:\n${observations}

Deliberation steps:
1. Extract pivotal clues or anomalies from the observations.
2. Generate exactly ${k} labelled hypotheses (H1, H2, ...) that explain the evidence.
3. For each hypothesis provide a concise statement, cite clues in the rationale, and assign 0-1 scores for prior_plausibility, explanatory_power, simplicity_penalty (penalise complexity), and testability.
4. Compute overall = prior_plausibility + explanatory_power + testability - simplicity_penalty (round to two decimals).
5. Recommend discriminating experiments_or_evidence and capture residual caveats in notes.

Apply the following razors and reference them explicitly where relevant:
${summarizeRazors(apply_razors)}

${STRICT_JSON_REMINDER}

JSON schema to emit:
{
 "hypotheses": [
  {"id":"H1","statement":"...","rationale":"...", "scores":{"prior_plausibility":0.6,"explanatory_power":0.7,"simplicity_penalty":0.2,"testability":0.6,"overall":1.7}}
 ],
 "experiments_or_evidence": ["test1"],
 "notes": "..."
}
Return only that JSON object.`;
        const buildFallback = () => ({
            hypotheses: Array.from({ length: Math.min(k, 3) }, (_, idx) => ({
                id: `H${idx + 1}`,
                statement: `Coherent explanation candidate ${idx + 1}`,
                rationale: "Sketch causal story consistent with observations.",
                scores: {
                    prior_plausibility: 0.5 - idx * 0.05,
                    explanatory_power: 0.6 - idx * 0.05,
                    simplicity_penalty: 0.2 + idx * 0.1,
                    testability: 0.6 - idx * 0.05,
                    overall: 1.5 - idx * 0.1,
                },
            })),
            experiments_or_evidence: ["Design discriminating test or gather missing data."],
            notes: "Deterministic fallback applied; rerun with sampling for richer detail.",
        });
        const { text, data, usedFallback } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 900,
            schema: OutputSchema,
            fallback: buildFallback,
        });
        if (!usedFallback && (!Array.isArray(data.hypotheses) || data.hypotheses.length === 0)) {
            const fallbackValue = buildFallback();
            const mergedWarnings = Array.from(new Set(["Model response lacked hypotheses; applied deterministic fallback.", ...(data.meta?.warnings ?? [])]));
            const payload = {
                ...fallbackValue,
                meta: {
                    source: "fallback",
                    warnings: mergedWarnings,
                    raw: data.meta?.raw,
                },
            };
            return textResult(JSON.stringify(payload, null, 2));
        }
        return textResult(text);
    };
    const config = {
        title: "Abductive hypotheses",
        description: "Generate k candidate hypotheses and rank by plausibility, explanatory power, simplicity (MDL proxy), and testability.",
        inputSchema: inputSchema,
    };
    server.registerTool("abductive.hypothesize", config, handler);
    // Back-compat alias
    server.registerTool("abductive_hypothesize", { title: config.title, description: "Alias for abductive.hypothesize (back-compat)." }, handler);
}
