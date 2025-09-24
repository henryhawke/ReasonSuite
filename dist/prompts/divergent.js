import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_REMINDER } from "../lib/prompt.js";
const ArgsSchema = z.object({
    prompt: z.string(),
    k: z.string().optional(),
    criteria: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerDivergentPrompts(server) {
    const callback = ((extra) => {
        const { prompt, k, criteria } = extra?.params ?? {};
        const ideaCount = k ?? "5";
        const critList = criteria ?? "novelty,consistency,relevance";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Run a divergent then convergent reasoning loop.\n\nProblem to explore:\n${prompt}\n\nNumber of initial ideas: ${ideaCount}\nScoring criteria (0-1): ${critList}\n\nDeliberation steps:\n1. Brainstorm ${ideaCount} distinct ideas or options related to the task (short bullet phrases are fine).\n2. Score each idea against every listed criterion between 0 and 1 with brief evaluator notes.\n3. Identify the winner and justify why it leads.\n4. Provide a synthesis that combines the best elements or next steps.\n${STRICT_JSON_REMINDER}\n\nJSON schema to emit:\n{"divergent":["idea1","idea2"],"scores":[{"id":1,"by":{"novelty":0.7,"consistency":0.6},"notes":"..."}],"winner":{"id":1,"why":"..."},"synthesis":"..."}\nReturn only that JSON object.`,
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
