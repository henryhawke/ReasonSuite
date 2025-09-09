import { z } from "zod";
export function registerAnalogicalPrompts(server) {
    server.registerPrompt("analogical.map", {
        title: "Analogical Mapping",
        description: "Map structure from source to target",
        argsSchema: { source_domain: z.string(), target_problem: z.string(), constraints: z.string().optional() },
    }, ({ source_domain, target_problem, constraints }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Build a structural analogy from SOURCE to TARGET.\n\nSOURCE: ${source_domain}\nTARGET: ${target_problem}\nCONSTRAINTS: ${constraints ?? ""}\n\nReturn JSON mapping, shared_relations, mismatches, transferable_insights, failure_modes.`,
                },
            },
        ],
    }));
}
