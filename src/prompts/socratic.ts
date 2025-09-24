import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";

const ArgsSchema = z.object({
    topic: z.string(),
    depth: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerSocraticPrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { topic, depth } = extra?.params ?? {};
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Produce a ${depth ?? "3"}-layer Socratic question tree for: ${topic}
Include assumptions_to_test, evidence_to_collect, next_actions. Output JSON.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "socratic.tree",
        {
            title: "Socratic Tree",
            description: "Generate multi-layer probing questions + assumptions/evidence",
            argsSchema: argsShape as any,
        },
        callback
    );
}
