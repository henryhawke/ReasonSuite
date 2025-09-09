import { z } from "zod";
export function registerSocraticPrompts(server) {
    server.registerPrompt("socratic.tree", {
        title: "Socratic Tree",
        description: "Generate multi-layer probing questions + assumptions/evidence",
        argsSchema: { topic: z.string(), depth: z.string().optional() },
    }, ({ topic, depth }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Produce a ${depth ?? "3"}-layer Socratic question tree for: ${topic}
Include assumptions_to_test, evidence_to_collect, next_actions. Output JSON.`,
                },
            },
        ],
    }));
}
