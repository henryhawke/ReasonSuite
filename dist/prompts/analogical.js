import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
const ArgsSchema = z.object({
    source_domain: z.string(),
    target_problem: z.string(),
    constraints: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerAnalogicalPrompts(server) {
    const callback = ({ source_domain, target_problem, constraints }, _extra) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Build a structural analogy from SOURCE to TARGET.\n\nSOURCE: ${source_domain}\nTARGET: ${target_problem}\nCONSTRAINTS: ${constraints ?? ""}\n\nReturn JSON mapping, shared_relations, mismatches, transferable_insights, failure_modes.`,
                },
            },
        ],
    });
    server.registerPrompt("analogical.map", {
        title: "Analogical Mapping",
        description: "Map structure from source to target",
        argsSchema: argsShape,
    }, callback);
}
