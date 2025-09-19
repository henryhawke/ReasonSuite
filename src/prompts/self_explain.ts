import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerSelfExplainPrompts(server: McpServer): void {
    server.registerPrompt(
        "reasoning.self_explain",
        {
            title: "Self-Explanation",
            description: "Rationale + evidence + critique + revision",
            argsSchema: { query: z.string(), allow_citations: z.string().optional() },
        },
        ({ query, allow_citations }) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Transparent Self-Explanation for: ${query}\nCitations allowed: ${allow_citations ?? "true"}\nReturn JSON with rationale, evidence, self_critique, revision.`,
                    },
                },
            ],
        })
    );
}



