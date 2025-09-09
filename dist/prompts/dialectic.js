import { z } from "zod";
export function registerDialecticPrompts(server) {
    server.registerPrompt("dialectic.tas", {
        title: "Dialectic TAS",
        description: "Thesis–Antithesis–Synthesis template",
        argsSchema: { claim: z.string(), context: z.string().optional() },
    }, ({ claim, context }) => ({
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
    }));
}
