import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
const ArgsSchema = z.object({
    observations: z.string(),
    k: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerAbductivePrompts(server) {
    const callback = ({ observations, k }, _extra) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Observations:\n${observations}\nGenerate ${k ?? "4"} abductive hypotheses with scores (prior, power, simplicity_penalty (MDL proxy), testability) and overall. Output JSON.`,
                },
            },
        ],
    });
    server.registerPrompt("abductive.hypotheses", {
        title: "Abductive Hypotheses",
        description: "k-best explanations with razors",
        argsSchema: argsShape,
    }, callback);
}
