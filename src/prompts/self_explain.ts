import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_REMINDER } from "../lib/prompt.js";

const ArgsSchema = z.object({
    query: z.string(),
    allow_citations: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerSelfExplainPrompts(server: McpServer): void {
    const callback = (({ query, allow_citations }: any, _extra: any) => {
        const citeFlag = allow_citations ?? "true";
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Produce a transparent self-explanation.\n\nQuery or answer under review:\n${query}\nCitations allowed now? ${citeFlag}\n\nDeliberation steps:\n1. Draft a numbered rationale that walks through the reasoning at a high level.\n2. Provide evidence entries linking each claim to a citation or state "would retrieve" if citations are disallowed.\n3. List self_critique items highlighting weaknesses, missing data, or assumptions.\n4. Offer a concise revision that incorporates the critiques.\n${STRICT_JSON_REMINDER}\n\nJSON schema to emit:\n{"rationale":["..."],"evidence":[{"claim":"...","source":"..."}],"self_critique":["..."],"revision":"..."}\nReturn only that JSON object.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "reasoning.self_explain",
        {
            title: "Self-Explanation",
            description: "Rationale + evidence + critique + revision",
            argsSchema: argsShape as any,
        },
        callback
    );
}
