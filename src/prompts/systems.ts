import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerSystemsPrompts(server: McpServer): void {
    server.registerPrompt(
        "systems.map",
        {
            title: "Systems Map (CLD)",
            description: "Mermaid CLD + loops + leverage points",
            argsSchema: { variables: z.string().optional(), context: z.string().optional() },
        },
        ({ variables, context }) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Build a concise causal loop diagram (CLD) for the system below.
Variables: ${variables ?? ""}
Context: ${context ?? ""}

Return JSON: { "mermaid": "...", "loops": [...], "leverage_points": [...], "stock_flow_hints": [...], "assumptions": [...], "risks": [...] }`,
                    },
                },
            ],
        })
    );
}


