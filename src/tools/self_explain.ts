import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";

const InputSchema = z.object({
    query: z.string(),
    allow_citations: z.boolean().default(true),
});

const inputSchema = InputSchema as any;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

const OutputSchema = z
    .object({
        rationale: z.array(z.string()).default([]),
        evidence: z.array(z.object({ claim: z.string(), source: z.string().optional() })).default([]),
        self_critique: z.array(z.string()).default([]),
        revision: z.string(),
    })
    .extend({ meta: ReasoningMetadataSchema.optional() });

export function registerSelfExplain(server: McpServer): void {
    const handler = async ({ query, allow_citations }: any) => {
        const prompt = `Transparent Self-Explanation.
Query: ${query}

Output strict JSON only:
{
  "rationale": ["step1","step2"],
  "evidence": [{"claim":"...","source":"url or doc id"}],
  "self_critique": ["possible flaw"],
  "revision": "final refined answer"
}
If citations allowed, include sources; otherwise, note what would be retrieved.`;
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 900,
            schema: OutputSchema,
            fallback: () => ({
                rationale: ["Restate question", "Identify governing principles"],
                evidence: allow_citations
                    ? [{ claim: "Reference constraint DSL", source: "doc://constraint-dsl.md" }]
                    : [{ claim: "Would cite constraint DSL guide if accessible" }],
                self_critique: ["Assumes references remain current", "May miss domain-specific nuances"],
                revision: "Deterministic fallback answer awaiting richer sampling.",
            }),
        });
        return { content: [{ type: "text", text }] };
    };

    const wrap = (h: any) => (args: any, _extra: any) => h(args);
    server.registerTool(
        "reasoning.self_explain",
        {
            title: "Transparent Self-Explanation",
            description: "Produce a rationale (chain-of-thought style summary), cite evidence, self-critique, and revise.",
            inputSchema,
        },
        wrap(handler)
    );
}
