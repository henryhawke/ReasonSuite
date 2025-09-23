import { z } from "zod";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    proposal: z.string(),
    rounds: z.number().int().min(1).max(5).default(2),
    focus: z.array(z.string()).default(["safety", "bias", "hallucination", "security", "privacy"]),
});
const inputShape = InputSchema.shape;
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
    const handler = async ({ proposal, rounds, focus }) => {
        const prompt = `Conduct ${rounds} rounds of Red (attack) vs Blue (defense) on:
${proposal}

Focus areas: ${focus.join(", ")}.
Return strict JSON only:
{
 "rounds":[
   {"n":1,"red":{"attack":"..."}, "blue":{"defense":"...","mitigations":["..."]}}
 ],
 "defects":[{"type":"...","severity":"low|med|high","evidence":"..."}],
 "risk_matrix":{"low":[],"medium":[],"high":[]},
 "final_guidance":["..."]
}`;
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 900,
            schema: OutputSchema,
            fallback: () => ({
                rounds: Array.from({ length: rounds }, (_, idx) => ({
                    n: idx + 1,
                    red: { attack: `Stress scenario ${idx + 1}: probe ${focus[idx % focus.length] ?? "failure"}` },
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
        return { content: [{ type: "text", text }] };
    };
    const config = {
        title: "Red vs Blue critique",
        description: "Run N rounds of adversarial challenge/defense on a proposal or answer. Returns a transcript + defects + risk matrix.",
        inputSchema: inputShape,
    };
    server.registerTool("redblue.challenge", config, handler);
    server.registerTool("redblue_challenge", config, handler);
}
