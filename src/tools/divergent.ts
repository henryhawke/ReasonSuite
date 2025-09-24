import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";

const InputSchema = z.object({
    prompt: z.string(),
    k: z.number().int().min(2).max(10).default(5),
    criteria: z.array(z.string()).default(["novelty", "consistency", "relevance"]),
});

const inputSchema = InputSchema as any;

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
    const handler = async ({ prompt, k, criteria }: any) => {
        const activeCriteria = criteria?.length ? criteria : ["novelty", "consistency", "relevance"];

        const text = `Divergent then Convergent.
Task: ${prompt}
Candidates: ${k}
Criteria: ${activeCriteria.join(", ")}

Return strict JSON only:
{
  "divergent": ["idea1","idea2",...],
  "scores": [{"id":1,"by":{"novelty":0.7,"consistency":0.6,"relevance":0.8},"notes":"..."}],
  "winner": {"id": 1, "why": "..."},
  "synthesis": "refined solution"
}`;
        const { text: resultText } = await sampleStructuredJson({
            server,
            prompt: text,
            maxTokens: 900,
            schema: z
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
                .extend({ meta: ReasoningMetadataSchema.optional() }),
            fallback: () => ({
                divergent: Array.from({ length: Math.min(k, 5) }, (_, idx) => `Idea ${idx + 1} for ${prompt}`),
                scores: [
                    {
                        id: 1,
                        by: Object.fromEntries(activeCriteria.map((criterion: string) => [criterion, 0.7] as const)),
                        notes: "Deterministic fallback scoring.",
                    },
                ],
                winner: { id: 1, why: "Best balance across criteria" },
                synthesis: "Combine leading idea with mitigations.",
            }),
        });
        return { content: [{ type: "text", text: resultText }] };
    };

    const config = {
        title: "Divergent–Convergent Creative",
        description: "Generate multiple options (divergent), then evaluate and converge with criteria (convergent).",
        inputSchema,
    };

    server.registerTool("reasoning.divergent_convergent", config, handler);
    server.registerTool("reasoning_divergent_convergent", config, handler);
}
