import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_REMINDER } from "../lib/prompt.js";
const ArgsSchema = z.object({
    observations: z.string(),
    k: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerAbductivePrompts(server) {
    const callback = ((extra) => {
        const { observations, k } = extra?.params ?? {};
        const target = k ?? "4";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `You are ReasonSuite's abductive reasoning engine.\n\nObservations:\n${observations}\n\nDeliberation steps:\n1. Extract the most telling clues or anomalies from the observations.\n2. Generate exactly ${target} labelled hypotheses (H1, H2, ...) that could explain the evidence.\n3. For each hypothesis provide a concise statement, a short rationale citing the clues, and 0-1 scores for prior_plausibility, explanatory_power, simplicity_penalty (penalize complexity), and testability.\n4. Compute overall = prior_plausibility + explanatory_power + testability - simplicity_penalty (round to two decimals).\n5. List discriminating experiments_or_evidence and capture any residual caveats in notes.\n${STRICT_JSON_REMINDER}\n\nJSON schema to emit:\n{"hypotheses":[{"id":"H1","statement":"...","rationale":"...","scores":{"prior_plausibility":0.0,"explanatory_power":0.0,"simplicity_penalty":0.0,"testability":0.0,"overall":0.0}}],"experiments_or_evidence":["..."],"notes":"..."}\nReturn only that JSON object.`,
                    },
                },
            ],
        };
    });
    server.registerPrompt("abductive.hypotheses", {
        title: "Abductive Hypotheses",
        description: "k-best explanations with razors",
        argsSchema: argsShape,
    }, callback);
}
