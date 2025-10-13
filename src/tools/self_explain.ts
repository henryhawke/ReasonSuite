import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult, textResult, type ToolCallback } from "../lib/mcp.js";
import { buildStructuredPrompt } from "../lib/prompt.js";
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
        const parsed = InputSchema.safeParse(rawArgs);
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for reasoning.self_explain", issues: parsed.error.issues });
        }
        const { query, allow_citations } = parsed.data;
        const prompt = buildStructuredPrompt({
            mode: "Self-explanation",
            objective: "Expose rationale, evidence, critique, and revision for the query.",
            inputs: { query, allow_citations: allow_citations ? "true" : "false" },
            steps: [
                "Draft a numbered rationale covering the reasoning arc.",
                allow_citations
                    ? "Provide evidence entries with citation sources."
                    : "Note where evidence would be retrieved since citations are disallowed.",
                "List self_critique items covering weaknesses or assumptions.",
                "Offer a concise revision incorporating the critiques.",
            ],
            schema:
                '{"rationale":[],"evidence":[{"claim":"","source":""}],"self_critique":[],"revision":""}',
        });
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 420,
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
