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
        const ideaCount = k ?? "5";
        const critList = criteria ?? "novelty,consistency,relevance";
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Run a divergent then convergent reasoning loop.\n\nProblem to explore:\n${prompt}\n\nNumber of initial ideas: ${ideaCount}\nScoring criteria (0-1): ${critList}\n\nProcess:\n1. Brainstorm ${ideaCount} distinct ideas or options related to the task (allow short bullet phrases).\n2. Score each idea against every listed criterion between 0 and 1. Capture short evaluator notes if useful.\n3. Identify the winner with an explanation of why it leads.\n4. Provide a synthesis that combines the best elements or next steps.\n\nRespond with strict JSON only:\n{"divergent":["idea1","idea2"],"scores":[{"id":1,"by":{"novelty":0.7,"consistency":0.6},"notes":"..."}],"winner":{"id":1,"why":"..."},"synthesis":"..."}\nDo not emit extra commentary beyond the JSON.`,
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
