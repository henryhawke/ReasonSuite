import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
const ArgsSchema = z.object({
    topic: z.string(),
    depth: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerSocraticPrompts(server) {
    const callback = ((extra) => {
        const { topic, depth } = extra?.params ?? {};
        return {
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
        };
    });
    server.registerPrompt("socratic.tree", {
        title: "Socratic Tree",
        description: "Generate multi-layer probing questions + assumptions/evidence",
        argsSchema: argsShape,
    }, callback);
}
