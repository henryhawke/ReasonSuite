import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";

const ArgsSchema = z.object({
    variables: z.string().optional(),
    context: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape);

export function registerSystemsPrompts(server: McpServer): void {
    const callback: PromptCallback<typeof argsShape> = ({ variables, context }, _extra) => ({
        messages: [
            {
                role: "user" as const,
                content: {
                    type: "text" as const,
                    text: `Build a concise causal loop diagram (CLD) for the system below.\nVariables: ${variables ?? ""}\nContext: ${context ?? ""}\n\nReturn JSON: { "mermaid": "...", "loops": [...], "leverage_points": [...], "stock_flow_hints": [...], "assumptions": [...], "risks": [...] }`,
                },
            },
        ],
    });

    server.registerPrompt(
        "systems.map",
        {
            title: "Systems Map (CLD)",
            description: "Mermaid CLD + loops + leverage points",
            argsSchema: argsShape,
        },
        callback
    );
}
