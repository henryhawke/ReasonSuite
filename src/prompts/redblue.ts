import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";

const ArgsSchema = z.object({
    proposal: z.string(),
    rounds: z.string().optional(),
    focus: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape);

export function registerRedBluePrompts(server: McpServer): void {
    const callback: PromptCallback<typeof argsShape> = ({ proposal, rounds, focus }, _extra) => ({
        messages: [
            {
                role: "user" as const,
                content: {
                    type: "text" as const,
                    text: `Conduct ${rounds ?? "2"} rounds of Red (attack) vs Blue (defense) on:\n${proposal}\n\nFocus areas: ${focus ?? "safety,bias,hallucination,security,privacy"}. Return JSON transcript, defects, risk_matrix, final_guidance.`,
                },
            },
        ],
    });

    server.registerPrompt(
        "redblue.challenge",
        {
            title: "Red/Blue Challenge",
            description: "Adversarial critique with risk matrix",
            argsSchema: argsShape,
        },
        callback
    );
}
