import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";

const ArgsSchema = z.object({
    claim: z.string(),
    context: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerDialecticPrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { claim, context } = extra?.params ?? {};
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Frame the following with a dialectic lens.
Claim: ${claim}
Context: ${context ?? ""}

Output JSON with thesis, antithesis, synthesis (proposal, assumptions, tradeoffs, evidence_needed), open_questions.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "dialectic.tas",
        {
            title: "Dialectic TAS",
            description: "Thesis–Antithesis–Synthesis template",
            argsSchema: argsShape as any,
        },
        callback
    );
}
