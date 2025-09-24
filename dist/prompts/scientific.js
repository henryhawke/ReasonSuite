import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
const ArgsSchema = z.object({
    goal: z.string(),
    context: z.string().optional(),
    allow_tools: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerScientificPrompts(server) {
    const callback = ((extra) => {
        const { goal, context, allow_tools } = extra?.params ?? {};
        const toolsFlag = allow_tools ?? "true";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Follow the ReasonSuite scientific analysis cadence.\n\nGoal:\n${goal}\n\nContext or known constraints:\n${context ?? "(none)"}\nTools allowed now? ${toolsFlag}\n\nProcedure:\n1. Decomposition – break the goal into manageable sub-problems or questions.\n2. Hypotheses – list candidate explanations or solution directions to test.\n3. Tests – propose concrete experiments, code executions, constraint checks, or observations (prefer tool calls if allow_tools is true).\n4. Verification – describe how falsification or validation will occur (Popper style).\n5. Answer – deliver the best current conclusion with caveats.\n\nRespond with strict JSON only:\n{"decomposition":["..."],"hypotheses":["..."],"tests":["..."],"verification":{"strategy":"...","popper_falsification":"..."},"answer":"..."}\nAvoid extra commentary outside the JSON.`,
                    },
                },
            ],
        };
    });
    server.registerPrompt("reasoning.scientific", {
        title: "Scientific Analytic",
        description: "Decompose → hypothesize → test → verify",
        argsSchema: argsShape,
    }, callback);
}
