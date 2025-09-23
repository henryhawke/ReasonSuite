import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
const ArgsSchema = z.object({
    proposal: z.string(),
    rounds: z.string().optional(),
    focus: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerRedBluePrompts(server) {
    const callback = ({ proposal, rounds, focus }, _extra) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Conduct ${rounds ?? "2"} rounds of Red (attack) vs Blue (defense) on:\n${proposal}\n\nFocus areas: ${focus ?? "safety,bias,hallucination,security,privacy"}. Return JSON transcript, defects, risk_matrix, final_guidance.`,
                },
            },
        ],
    });
    server.registerPrompt("redblue.challenge", {
        title: "Red/Blue Challenge",
        description: "Adversarial critique with risk matrix",
        argsSchema: argsShape,
    }, callback);
}
