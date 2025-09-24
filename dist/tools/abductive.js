import { z } from "zod";
import { DEFAULT_RAZORS, summarizeRazors } from "../lib/razors.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    observations: z.string(),
    k: z.number().int().min(2).max(10).default(4),
    apply_razors: z.array(z.string()).default([...DEFAULT_RAZORS]),
});
const inputSchema = InputSchema;
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
    const handler = async ({ observations, k, apply_razors }) => {
        const prompt = `Observations:\n${observations}

Generate ${k} abductive hypotheses. Score each on:
- prior_plausibility (0-1)
- explanatory_power (0-1)
- simplicity_penalty (0-1)
- testability (0-1)
- overall_score = prior_plausibility + explanatory_power + testability - simplicity_penalty

Apply the following razors and reference them explicitly where relevant:
${summarizeRazors(apply_razors)}

Return strict JSON only:
{
 "hypotheses": [
  {"id":"H1","statement":"...","rationale":"...", "scores":{"prior_plausibility":0.6,"explanatory_power":0.7,"simplicity_penalty":0.2,"testability":0.6,"overall":1.7}}
 ],
 "experiments_or_evidence": ["test1"],
 "notes": "..."
}`;
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 900,
            schema: OutputSchema,
            fallback: () => ({
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
            }),
        });
        return { content: [{ type: "text", text }] };
    };
    const config = {
        title: "Abductive hypotheses",
        description: "Generate k candidate hypotheses and rank by plausibility, explanatory power, simplicity (MDL proxy), and testability.",
        inputSchema,
    };
    server.registerTool("abductive.hypothesize", config, handler);
    server.registerTool("abductive_hypothesize", config, handler);
    server.registerTool("abductive-hypothesize", config, handler);
}
