import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
const ArgsSchema = z.object({
    proposal: z.string(),
    rounds: z.string().optional(),
    focus: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerRedBluePrompts(server) {
    const callback = ((extra) => {
        const { proposal, rounds, focus } = extra?.params ?? {};
        const roundCount = rounds ?? "2";
        const focusList = focus ?? "safety,bias,hallucination,security,privacy";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Run a structured red team vs blue team exercise.\n\nProposal under review:\n${proposal}\n\nNumber of rounds: ${roundCount}\nFocus areas: ${focusList}\n\nFor each round perform: red.attack (describe the most concerning failure mode) and blue.defense (describe mitigation plus mitigations list).\nAfter all rounds:\n- List aggregated defects with type, severity (low|med|high), and supporting evidence.\n- Populate a risk_matrix with arrays for low, medium, and high risks.\n- Provide final_guidance actions or sign-off criteria.\n\nRespond with strict JSON only:\n{"rounds":[{"n":1,"red":{"attack":"..."},"blue":{"defense":"...","mitigations":["..."]}}],"defects":[{"type":"...","severity":"low","evidence":"..."}],"risk_matrix":{"low":["..."],"medium":["..."],"high":["..."]},"final_guidance":["..."]}\nDo not add extra narrative outside the JSON.`,
                    },
                },
            ],
        };
    });
    server.registerPrompt("redblue.challenge", {
        title: "Red/Blue Challenge",
        description: "Adversarial critique with risk matrix",
        argsSchema: argsShape,
    }, callback);
}
