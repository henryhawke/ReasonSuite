import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerScientificPrompts(server: McpServer): void {
    server.registerPrompt(
        "reasoning.scientific",
        {
            title: "Scientific Analytic",
            description: "Decompose → hypothesize → test → verify",
            argsSchema: { goal: z.string(), context: z.string().optional(), allow_tools: z.string().optional() },
        },
        ({ goal, context, allow_tools }) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `You are an agent following a Scientific Analytic Framework.\nGoal: ${goal}\nContext: ${context ?? ""}\nAllow tools: ${allow_tools ?? "true"}\nReturn JSON with decomposition, hypotheses, tests, verification, answer.`,
                    },
                },
            ],
        })
    );
}



