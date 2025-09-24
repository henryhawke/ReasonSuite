import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
const ArgsSchema = z.object({
    prompt: z.string(),
    k: z.string().optional(),
    criteria: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerDivergentPrompts(server) {
    const callback = ((extra) => {
        const { prompt, k, criteria } = extra?.params ?? {};
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Divergent (ideas) then Convergent (scoring).\nTask: ${prompt}\nK: ${k ?? "5"}\nCriteria: ${criteria ?? "novelty,consistency,relevance"}\nReturn JSON with divergent, scores, winner, synthesis.`,
                    },
                },
            ],
        };
    });
    server.registerPrompt("reasoning.divergent_convergent", {
        title: "Divergent–Convergent",
        description: "Brainstorm then evaluate & synthesize",
        argsSchema: argsShape,
    }, callback);
}
