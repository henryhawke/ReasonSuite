import { z } from "zod";
import { textResult } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    prompt: z.string(),
    k: z.number().int().min(2).max(10).default(5),
    criteria: z.array(z.string()).default(["novelty", "consistency", "relevance"]),
});
const inputSchema = InputSchema.shape;
const OutputSchema = z
    .object({
    divergent: z.array(z.string()).default([]),
    scores: z
        .array(z.object({
        id: z.number().int(),
        by: z.record(z.string(), z.number()),
        notes: z.string().optional(),
    }))
        .default([]),
    winner: z.object({ id: z.number().int(), why: z.string() }),
    synthesis: z.string(),
})
    .extend({ meta: ReasoningMetadataSchema.optional() });
export function registerDivergent(server) {
    const handler = async (rawArgs, _extra) => {
        const { prompt, k, criteria } = rawArgs;
        const activeCriteria = criteria?.length ? criteria : ["novelty", "consistency", "relevance"];
        const promptText = `Divergent then Convergent.
Task: ${prompt}
Candidates: ${k}
Criteria: ${activeCriteria.join(", ")}

Deliberation steps:
1. Brainstorm ${k} distinct ideas or options (short bullet phrases are fine).
2. Score each idea against every listed criterion between 0 and 1 with concise notes.
3. Select a winner and justify why it leads.
4. Provide a synthesis that combines the best elements or next steps.

${STRICT_JSON_REMINDER}

JSON schema to emit:
{
  "divergent": ["idea1","idea2",...],
  "scores": [{"id":1,"by":{"novelty":0.7,"consistency":0.6,"relevance":0.8},"notes":"..."}],
  "winner": {"id": 1, "why": "..."},
  "synthesis": "refined solution"
}
Return only that JSON object.`;
        const { text: resultText } = await sampleStructuredJson({
            server,
            prompt: promptText,
            maxTokens: 900,
            schema: OutputSchema,
            fallback: () => ({
                divergent: Array.from({ length: Math.min(k, 5) }, (_, idx) => `Idea ${idx + 1} for ${prompt}`),
                scores: [
                    {
                        id: 1,
                        by: Object.fromEntries(activeCriteria.map((criterion) => [criterion, 0.7])),
                        notes: "Deterministic fallback scoring.",
                    },
                ],
                winner: { id: 1, why: "Best balance across criteria" },
                synthesis: "Combine leading idea with mitigations.",
            }),
        });
        return textResult(resultText);
    };
    const config = {
        title: "Divergent–Convergent Creative",
        description: "Generate multiple options (divergent), then evaluate and converge with criteria (convergent).",
        // inputSchema,
    };
    server.registerTool("reasoning.divergent_convergent", config, handler);
    // Back-compat alias
    server.registerTool("reasoning_divergent_convergent", { title: config.title, description: "Alias for reasoning.divergent_convergent (back-compat)." }, handler);
}
