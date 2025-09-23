import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
const ArgsSchema = z.object({
    goal: z.string(),
    context: z.string().optional(),
    allow_tools: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerScientificPrompts(server) {
    const callback = ({ goal, context, allow_tools }, _extra) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `You are an agent following a Scientific Analytic Framework.\nGoal: ${goal}\nContext: ${context ?? ""}\nAllow tools: ${allow_tools ?? "true"}\nReturn JSON with decomposition, hypotheses, tests, verification, answer.`,
                },
            },
        ],
    });
    server.registerPrompt("reasoning.scientific", {
        title: "Scientific Analytic",
        description: "Decompose → hypothesize → test → verify",
        argsSchema: argsShape,
    }, callback);
}
