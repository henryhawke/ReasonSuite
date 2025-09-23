import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";

const ArgsSchema = z.object({
    query: z.string(),
    allow_citations: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape);

export function registerSelfExplainPrompts(server: McpServer): void {
    const callback: PromptCallback<typeof argsShape> = ({ query, allow_citations }, _extra) => ({
        messages: [
            {
                role: "user" as const,
                content: {
                    type: "text" as const,
                    text: `Transparent Self-Explanation for: ${query}\nCitations allowed: ${allow_citations ?? "true"}\nReturn JSON with rationale, evidence, self_critique, revision.`,
                },
            },
        ],
    });

    server.registerPrompt(
        "reasoning.self_explain",
        {
            title: "Self-Explanation",
            description: "Rationale + evidence + critique + revision",
            argsSchema: argsShape,
        },
        callback
    );
}
