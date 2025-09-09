import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerAbductivePrompts(server: McpServer): void {
    server.registerPrompt(
        "abductive.hypotheses",
        {
            title: "Abductive Hypotheses",
            description: "k-best explanations with razors",
            argsSchema: { observations: z.string(), k: z.string().optional() },
        },
        ({ observations, k }) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Observations:\n${observations}\nGenerate ${k ?? "4"} abductive hypotheses with scores (prior, power, simplicity_penalty (MDL proxy), testability) and overall. Output JSON.`,
                    },
                },
            ],
        })
    );
}


