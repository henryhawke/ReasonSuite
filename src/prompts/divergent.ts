import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerDivergentPrompts(server: McpServer): void {
    server.registerPrompt(
        "reasoning.divergent_convergent",
        {
            title: "Divergent–Convergent",
            description: "Brainstorm then evaluate & synthesize",
            argsSchema: { prompt: z.string(), k: z.string().optional(), criteria: z.string().optional() },
        },
        ({ prompt, k, criteria }) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Divergent (ideas) then Convergent (scoring).\nTask: ${prompt}\nK: ${k ?? "5"}\nCriteria: ${criteria ?? "novelty,consistency,relevance"}\nReturn JSON with divergent, scores, winner, synthesis.`,
                    },
                },
            ],
        })
    );
}



