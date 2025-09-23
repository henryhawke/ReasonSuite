import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";

const ArgsSchema = z.object({
    observations: z.string(),
    k: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape);

export function registerAbductivePrompts(server: McpServer): void {
    const callback: PromptCallback<typeof argsShape> = ({ observations, k }, _extra) => ({
        messages: [
            {
                role: "user" as const,
                content: {
                    type: "text" as const,
                    text: `Observations:\n${observations}\nGenerate ${k ?? "4"} abductive hypotheses with scores (prior, power, simplicity_penalty (MDL proxy), testability) and overall. Output JSON.`,
                },
            },
        ],
    });

    server.registerPrompt(
        "abductive.hypotheses",
        {
            title: "Abductive Hypotheses",
            description: "k-best explanations with razors",
            argsSchema: argsShape,
        },
        callback
    );
}
