import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
const ArgsSchema = z.object({
    claim: z.string(),
    context: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerDialecticPrompts(server) {
    const callback = ({ claim, context }, _extra) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Frame the following with a dialectic lens.
Claim: ${claim}
Context: ${context ?? ""}

Output JSON with thesis, antithesis, synthesis (proposal, assumptions, tradeoffs, evidence_needed), open_questions.`,
                },
            },
        ],
    });
    server.registerPrompt("dialectic.tas", {
        title: "Dialectic TAS",
        description: "Thesis–Antithesis–Synthesis template",
        argsSchema: argsShape,
    }, callback);
}
