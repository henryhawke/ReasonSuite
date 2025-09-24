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
        const layers = depth ?? "3";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Generate a Socratic questioning tree.\n\nTopic:\n${topic}\nDesired depth (layers): ${layers}\n\nProcedure:\n1. For each layer from 1 to ${layers}, list probing questions that deepen understanding of the topic.\n   - Layer 1 clarifies scope and definitions.\n   - Deeper layers challenge assumptions and evidence.\n2. Summarise assumptions_to_test exposed by the questioning.\n3. Recommend evidence_to_collect.\n4. Suggest next_actions to close knowledge gaps.\n\nRespond with strict JSON only:\n{"layers":[{"level":1,"questions":["..."]}],"assumptions_to_test":["..."],"evidence_to_collect":["..."],"next_actions":["..."]}\nNo additional prose outside the JSON.`,
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
