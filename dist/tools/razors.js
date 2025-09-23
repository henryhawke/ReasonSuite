import { z } from "zod";
import { DEFAULT_RAZORS, summarizeRazors } from "../lib/razors.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    candidates_json: z.string().describe("JSON array or object of candidates"),
    razors: z.array(z.string()).default([...DEFAULT_RAZORS]),
});
const inputShape = InputSchema.shape;
const OutputSchema = z
    .object({
    results: z
        .array(z.object({
        id: z.string(),
        keep_or_drop: z.enum(["keep", "drop", "revise"]),
        reasons: z.array(z.string()).default([]),
        risk_notes: z.string().optional(),
    }))
        .default([]),
    shortlist: z.array(z.string()).default([]),
    notes: z.string().optional(),
})
    .extend({ meta: ReasoningMetadataSchema.optional() });
export function registerRazors(server) {
    const handler = async ({ candidates_json, razors }) => {
        const prompt = `Candidates JSON:\n${candidates_json}
Razors to apply (explain how each affects the verdict):
${summarizeRazors(razors)}

For each candidate produce JSON objects:
{"id":"...","keep_or_drop":"keep|drop|revise","reasons":["..."],"risk_notes":"..."}

Return strict JSON only:
{ "results": [...], "shortlist": ["ids..."], "notes": "..." }`;
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 700,
            schema: OutputSchema,
            fallback: () => ({
                results: [
                    {
                        id: "candidate-1",
                        keep_or_drop: "keep",
                        reasons: ["Simplest explanation consistent with MDL", "Survives Popper falsifiability"],
                        risk_notes: "Monitor for new contradictory evidence",
                    },
                ],
                shortlist: ["candidate-1"],
                notes: "Deterministic fallback applied; validate candidates_json structure.",
            }),
        });
        return { content: [{ type: "text", text }] };
    };
    server.registerTool("razors.apply", {
        title: "Apply reasoning razors",
        description: "Given candidate explanations, apply Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, Popper falsifiability to produce keep/drop recommendations.",
        inputSchema: inputShape,
    }, handler);
}
