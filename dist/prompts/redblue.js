import { z } from "zod";
export function registerRedBluePrompts(server) {
    server.registerPrompt("redblue.challenge", {
        title: "Red/Blue Challenge",
        description: "Adversarial critique with risk matrix",
        argsSchema: {
            proposal: z.string(),
            rounds: z.string().optional(),
            focus: z.string().optional(),
        },
    }, ({ proposal, rounds, focus }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Conduct ${rounds ?? "2"} rounds of Red (attack) vs Blue (defense) on:\n${proposal}\n\nFocus areas: ${focus ?? "safety,bias,hallucination,security,privacy"}. Return JSON transcript, defects, risk_matrix, final_guidance.`,
                },
            },
        ],
    }));
}
