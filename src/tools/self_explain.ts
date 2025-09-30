import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { textResult, type ToolCallback } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";

const InputSchema = z.object({
    query: z.string(),
    allow_citations: z.boolean().default(true),
});

const inputSchema = InputSchema.shape;

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
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        const { query, allow_citations } = rawArgs as InputArgs;
        const prompt = `Transparent Self-Explanation.
Query: ${query}
Citations allowed? ${allow_citations ? "true" : "false"}

Deliberation steps:
1. Draft a numbered rationale that walks through the reasoning at a high level.
2. Provide evidence entries linking each claim to a citation or note what would be retrieved if citations are disallowed.
3. List self_critique items highlighting weaknesses, missing data, or assumptions.
4. Offer a concise revision that incorporates the critiques.

${STRICT_JSON_REMINDER}

JSON schema to emit:
{
  "rationale": ["step1","step2"],
  "evidence": [{"claim":"...","source":"url or doc id"}],
  "self_critique": ["possible flaw"],
  "revision": "final refined answer"
}
Return only that JSON object.`;
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
                revision: "Deterministic heuristic analysis based on query structure.",
            }),
        });
        return textResult(text);
    };

    server.registerTool(
        "reasoning.self_explain",
        {
            title: "Transparent Self-Explanation",
            description: "Produce a rationale (chain-of-thought style summary), cite evidence, self-critique, and revise.",
            inputSchema: inputSchema,
        },
        handler
    );
    // Back-compat alias
    server.registerTool(
        "reasoning_self_explain",
        { title: "Transparent Self-Explanation (alias)", description: "Alias for reasoning.self_explain (back-compat)." },
        handler
    );
}
