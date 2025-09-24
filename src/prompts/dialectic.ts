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
                        text: `Apply a structured thesis–antithesis–synthesis analysis.\n\nClaim or proposal:\n${claim}\n\nContext or audience notes:\n${context ?? "(none)"}\n\nFollow these steps:\n1. Summarise the best version of the thesis supporting the claim, listing concrete key_points.\n2. Develop the strongest antithesis highlighting counterarguments, missing evidence, or risks.\n3. Craft a synthesis that reconciles or updates the claim, including proposal, assumptions, tradeoffs, and evidence_needed.\n4. List remaining open_questions that must be addressed.\n\nReturn strict JSON only:\n{"thesis":{"position":"...","key_points":["..."]},"antithesis":{"position":"...","key_points":["..."]},"synthesis":{"proposal":"...","assumptions":["..."],"tradeoffs":["..."],"evidence_needed":["..."]},"open_questions":["..."]}\nNo additional narration outside the JSON response.`,
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
