import { z } from "zod";
import { jsonResult, textResult } from "../lib/mcp.js";
import { normalizeToolInput } from "../lib/args.js";
import { buildStructuredPrompt } from "../lib/prompt.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    proposal: z.string(),
    rounds: z.number().int().min(1).max(5).default(2),
    focus: z.array(z.string()).default(["safety", "bias", "hallucination", "security", "privacy"]),
});
const inputSchema = InputSchema.shape;
const OutputSchema = z
    .object({
    rounds: z
        .array(z.object({
        n: z.number().int(),
        red: z.object({ attack: z.string() }),
        blue: z.object({
            defense: z.string(),
            mitigations: z.array(z.string()).default([]),
        }),
    }))
        .default([]),
    defects: z
        .array(z.object({
        type: z.string(),
        severity: z.enum(["low", "med", "high"]),
        evidence: z.string(),
    }))
        .default([]),
    risk_matrix: z.object({
        low: z.array(z.string()).default([]),
        medium: z.array(z.string()).default([]),
        high: z.array(z.string()).default([]),
    }),
    final_guidance: z.array(z.string()).default([]),
})
    .extend({ meta: ReasoningMetadataSchema.optional() });
export function registerRedBlue(server) {
    const handler = async (rawArgs, _extra) => {
        // Validate and apply defaults to input arguments
        const parsed = InputSchema.safeParse(normalizeToolInput(rawArgs));
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for redblue.challenge", issues: parsed.error.issues });
        }
        const { proposal, rounds = 2, focus = ["safety", "bias", "hallucination", "security", "privacy"] } = parsed.data;
        const prompt = buildStructuredPrompt({
            mode: "Red vs Blue",
            objective: `Run ${rounds} adversarial rounds on the proposal and synthesize risks.`,
            inputs: { proposal, focus: focus.join(", ") },
            steps: [
                "Red: state the most critical attack vector or failure mode per round.",
                "Blue: describe defense strategy and mitigations.",
                "Aggregate defects with type, severity (low|med|high), evidence.",
                "Summarize risk_matrix buckets (low/medium/high).",
                "Provide actionable final_guidance.",
            ],
            schema: '{"rounds":[{"n":1,"red":{"attack":""},"blue":{"defense":"","mitigations":[]}}],"defects":[{"type":"","severity":"low","evidence":""}],"risk_matrix":{"low":[],"medium":[],"high":[]},"final_guidance":[]}',
        });
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 1200,
            schema: OutputSchema,
            fallback: () => ({
                rounds: Array.from({ length: rounds || 2 }, (_, idx) => ({
                    n: idx + 1,
                    red: { attack: `Stress scenario ${idx + 1}: probe ${focus?.[idx % (focus?.length || 5)] ?? "failure"}` },
                    blue: {
                        defense: "Document mitigations and residual risks.",
                        mitigations: ["Add guardrails", "Strengthen monitoring"],
                    },
                })),
                defects: [
                    { type: "coverage_gap", severity: "med", evidence: "Fallback analysis" },
                ],
                risk_matrix: { low: ["low impact issues"], medium: ["monitor residual risk"], high: [] },
                final_guidance: ["Close medium risks", "Schedule re-test after mitigations"],
            }),
        });
        return textResult(text);
    };
    const config = {
        title: "Red vs Blue critique",
        description: "Run N rounds of adversarial challenge/defense on a proposal or answer. Returns a transcript + defects + risk matrix.",
        inputSchema: inputSchema,
    };
    server.registerTool("redblue.challenge", config, handler);
    // Back-compat alias
    server.registerTool("redblue_challenge", { title: config.title, description: "Alias for redblue.challenge (back-compat)." }, handler);
}
