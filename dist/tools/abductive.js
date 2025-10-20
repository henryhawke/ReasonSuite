import { z } from "zod";
import { jsonResult, textResult } from "../lib/mcp.js";
import { normalizeToolInput } from "../lib/args.js";
import { buildStructuredPrompt } from "../lib/prompt.js";
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
        // Validate and apply defaults to input arguments
        const parsed = InputSchema.safeParse(normalizeToolInput(rawArgs));
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for abductive.hypothesize", issues: parsed.error.issues });
        }
        const { observations, k = 4, apply_razors = [...DEFAULT_RAZORS] } = parsed.data;
        const prompt = buildStructuredPrompt({
            mode: "Abductive",
            objective: `Rank ${k} hypotheses that best explain the observations with razor checks.`,
            inputs: { observations },
            steps: [
                "Extract pivotal clues or anomalies.",
                `Generate exactly ${k} labelled hypotheses (H1…H${k}).`,
                "For each: give statement, cite clues, score prior_plausibility, explanatory_power, simplicity_penalty, testability.",
                "Compute overall = prior + explanatory + testability − simplicity_penalty (2 decimals).",
                "List discriminating experiments_or_evidence and residual notes.",
            ],
            extras: [`Apply razors in reasoning: ${summarizeRazors(apply_razors)}`],
            schema: '{"hypotheses":[{"id":"H1","statement":"","rationale":"","scores":{"prior_plausibility":0,"explanatory_power":0,"simplicity_penalty":0,"testability":0,"overall":0}}],"experiments_or_evidence":[],"notes":""}',
        });
        const buildFallback = () => {
            const desired = Math.min(Math.max(k ?? 4, 2), 10);
            const tokens = (observations ?? "")
                .toLowerCase()
                .match(/\b[a-z0-9][a-z0-9\-]{2,}\b/g);
            const stopWords = new Set([
                "the",
                "that",
                "with",
                "from",
                "have",
                "after",
                "before",
                "since",
                "because",
                "error",
                "errors",
                "issue",
                "issues",
                "spike",
                "spikes",
                "latency",
                "latencies",
                "users",
                "using",
                "during",
                "every",
                "hours",
                "about",
                "count",
                "rate",
                "rates",
            ]);
            const keywords = Array.from(new Set((tokens ?? []).filter((word) => !stopWords.has(word)))).slice(0, 6);
            const highlights = observations
                .split(/\.|\n/)
                .map((piece) => piece.trim())
                .filter((piece) => piece.length > 0)
                .slice(0, 3);
            const clamp = (value) => Math.max(0, Math.min(1, Number(value.toFixed(2))));
            const hypotheses = Array.from({ length: desired }, (_, idx) => {
                const keyword = keywords[idx % (keywords.length || 1)] ?? `factor ${idx + 1}`;
                const highlight = highlights[idx % (highlights.length || 1)] ?? observations.slice(0, 120);
                const focusPhrase = keyword.replace(/[-_]/g, " ");
                const id = `H${idx + 1}`;
                const prior = clamp(0.68 - idx * 0.08);
                const explanatory = clamp(0.7 - idx * 0.07);
                const simplicity = clamp(0.22 + idx * 0.05);
                const testability = clamp(0.66 - idx * 0.05);
                const overall = clamp(prior + explanatory + testability - simplicity);
                return {
                    id,
                    statement: `The leading explanation centres on ${focusPhrase} behaving abnormally.`,
                    rationale: highlight
                        ? `Matches the observation: "${highlight.replace(/"/g, "'")}" and fits the timing described.`
                        : "Consistent with the overall anomaly pattern in the observations.",
                    scores: {
                        prior_plausibility: prior,
                        explanatory_power: explanatory,
                        simplicity_penalty: simplicity,
                        testability: testability,
                        overall,
                    },
                };
            });
            const experiments = (keywords.length ? keywords : ["the dominant anomaly"])
                .slice(0, 3)
                .map((word) => `Collect targeted telemetry around ${word} and compare pre/post baselines.`);
            return {
                hypotheses,
                experiments_or_evidence: experiments,
                notes: "Deterministic heuristic analysis; provides structured hypothesis ranking.",
            };
        };
        const { text, data, usedFallback } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 540,
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
                    prompt_chars: data.meta?.prompt_chars,
                    prompt_tokens_estimate: data.meta?.prompt_tokens_estimate,
                    response_chars: data.meta?.response_chars,
                    response_tokens_estimate: data.meta?.response_tokens_estimate,
                },
            };
            return textResult(JSON.stringify(payload));
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
