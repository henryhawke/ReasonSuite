import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";

const ArgsSchema = z.object({
    prompt: z.string(),
    k: z.string().optional(),
    criteria: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerDivergentPrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { prompt, k, criteria } = extra?.params ?? {};
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Divergent (ideas) then Convergent (scoring).\nTask: ${prompt}\nK: ${k ?? "5"}\nCriteria: ${criteria ?? "novelty,consistency,relevance"}\nReturn JSON with divergent, scores, winner, synthesis.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "reasoning.divergent_convergent",
        {
            title: "Divergent–Convergent",
            description: "Brainstorm then evaluate & synthesize",
            argsSchema: argsShape as any,
        },
        callback
    );
}
