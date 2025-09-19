import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerSelfExplain(server: McpServer): void {
    server.registerTool(
        "reasoning.self_explain",
        {
            title: "Transparent Self-Explanation",
            description: "Produce a rationale (chain-of-thought style summary), cite evidence, self-critique, and revise.",
            inputSchema: {
                query: z.string(),
                allow_citations: z.boolean().default(true),
            },
        },
        async ({ query, allow_citations }) => {
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
            try {
                const resp = await server.server.createMessage({
                    messages: [{ role: "user", content: { type: "text", text: prompt } }],
                    maxTokens: 900,
                });
                const out = resp.content.type === "text" ? resp.content.text : "{}";
                return { content: [{ type: "text", text: out }] };
            } catch {
                const fallback = {
                    rationale: ["analyze", "compare"],
                    evidence: allow_citations ? [{ claim: "", source: "doc://razors.md" }] : [],
                    self_critique: ["unclear assumptions"],
                    revision: "draft",
                };
                return { content: [{ type: "text", text: JSON.stringify(fallback, null, 2) }] };
            }
        }
    );
}



