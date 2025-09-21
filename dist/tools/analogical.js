import { z } from "zod";
export function registerAnalogical(server) {
    const config = {
        title: "Analogical mapping",
        description: "Map structure from a source domain to a target problem; identify correspondences, constraints, and transfer risks.",
        inputSchema: {
            source_domain: z.string(),
            target_problem: z.string(),
            constraints: z.string().optional(),
        },
    };
    const handler = async ({ source_domain, target_problem, constraints }) => {
        const prompt = `Build a structural analogy from SOURCE to TARGET.

SOURCE: ${source_domain}
TARGET: ${target_problem}
CONSTRAINTS: ${constraints ?? ""}

JSON only:
{
 "mapping":[{"source":"...","target":"...","justification":"..."}],
 "shared_relations":["..."],
 "mismatches":["..."],
 "transferable_insights":["..."],
 "failure_modes":["..."]
}`;
        const resp = await server.server.createMessage({
            messages: [{ role: "user", content: { type: "text", text: prompt } }],
            maxTokens: 900,
        });
        return { content: [{ type: "text", text: resp.content.type === "text" ? resp.content.text : "{}" }] };
    };
    server.registerTool("analogical.map", config, handler);
    server.registerTool("analogical_map", config, handler);
}
