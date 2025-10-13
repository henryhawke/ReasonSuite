import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult, textResult, type ToolCallback } from "../lib/mcp.js";
import { buildStructuredPrompt } from "../lib/prompt.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";

const InputSchema = z.object({
    prompt: z.string(),
    k: z.number().int().min(2).max(10).default(5),
    criteria: z.array(z.string()).default(["novelty", "consistency", "relevance"]),
});

const inputSchema = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

const OutputSchema = z
    .object({
        divergent: z.array(z.string()).default([]),
        scores: z
            .array(
                z.object({
                    id: z.number().int(),
                    by: z.record(z.string(), z.number()),
                    notes: z.string().optional(),
                })
            )
            .default([]),
        winner: z.object({ id: z.number().int(), why: z.string() }),
        synthesis: z.string(),
    })
    .extend({ meta: ReasoningMetadataSchema.optional() });

export function registerDivergent(server: McpServer): void {
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        const parsed = InputSchema.safeParse(rawArgs);
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for reasoning.divergent_convergent", issues: parsed.error.issues });
        }
        const { prompt, k, criteria } = parsed.data;
        const activeCriteria = criteria?.length ? criteria : ["novelty", "consistency", "relevance"];
        const promptText = buildStructuredPrompt({
            mode: "Divergent→Convergent",
            objective: "Expand the option space then converge on the strongest idea with scoring.",
            inputs: { prompt, candidates: String(k), criteria: activeCriteria.join(", ") },
            steps: [
                `Brainstorm ${k} distinct ideas or options (short phrases ok).`,
                "Score each idea 0-1 for every criterion with concise notes.",
                "Select a winner and justify why it leads.",
                "Provide a synthesis that combines the best elements or next steps.",
            ],
            schema:
                '{"divergent":[],"scores":[{"id":1,"by":{"criterion":0},"notes":""}],"winner":{"id":1,"why":""},"synthesis":""}',
        });
        const { text: resultText } = await sampleStructuredJson({
            server,
            prompt: promptText,
            maxTokens: 520,
            schema: OutputSchema,
            fallback: () => ({
                divergent: Array.from({ length: Math.min(k, 5) }, (_, idx) => `Idea ${idx + 1} for ${prompt}`),
                scores: [
                    {
                        id: 1,
                        by: Object.fromEntries(activeCriteria.map((criterion: string) => [criterion, 0.7] as const)),
                        notes: "Deterministic heuristic scoring.",
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
        inputSchema: inputSchema,
    };

    server.registerTool("reasoning.divergent_convergent", config, handler);
    // Back-compat alias
    server.registerTool(
        "reasoning_divergent_convergent",
        { title: config.title, description: "Alias for reasoning.divergent_convergent (back-compat)." },
        handler
    );
}
