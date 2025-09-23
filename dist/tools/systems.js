import { z } from "zod";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    variables: z.array(z.string()).describe("Known variables").default([]),
    context: z.string().optional(),
});
const inputShape = InputSchema.shape;
const OutputSchema = z
    .object({
    mermaid: z.string(),
    loops: z.array(z.object({ type: z.enum(["reinforcing", "balancing"]), nodes: z.array(z.string()).default([]) })).default([]),
    leverage_points: z.array(z.string()).default([]),
    stock_flow_hints: z
        .array(z.object({ stock: z.string(), inflows: z.array(z.string()).default([]), outflows: z.array(z.string()).default([]) }))
        .default([]),
    assumptions: z.array(z.string()).default([]),
    risks: z.array(z.string()).default([]),
})
    .extend({ meta: ReasoningMetadataSchema.optional() });
export function registerSystems(server) {
    const handler = async ({ variables, context }) => {
        const prompt = `Build a concise causal loop diagram (CLD) for the system below.
Variables: ${variables.join(", ") || "(discover reasonable variables)"}
Context: ${context ?? ""}

Return strict JSON only:
{
 "mermaid":"graph LR; A-->B; B-.-|neg|C; ...",
 "loops":[{"type":"reinforcing","nodes":["..."]},{"type":"balancing","nodes":["..."]}],
 "leverage_points":["rules","information_flow","goals","paradigms"],
 "stock_flow_hints":[{"stock":"...","inflows":["..."],"outflows":["..."]}],
 "assumptions":["..."],
 "risks":["..."]
}`;
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 1000,
            schema: OutputSchema,
            fallback: () => ({
                mermaid: "graph LR; need[Need]-->action[Action]; action-->outcome[Outcome]; outcome-->|feedback|need;",
                loops: [
                    { type: "reinforcing", nodes: ["Need", "Action", "Outcome"] },
                    { type: "balancing", nodes: ["Outcome", "Constraints"] },
                ],
                leverage_points: ["Information flows", "Rules", "Goals"],
                stock_flow_hints: [
                    { stock: "Resource", inflows: ["Investment"], outflows: ["Consumption"] },
                ],
                assumptions: ["Variables listed capture dominant dynamics"],
                risks: ["Hidden delays or non-linearities"],
            }),
        });
        return { content: [{ type: "text", text }] };
    };
    const config = {
        title: "Systems map (CLD)",
        description: "Create a causal loop diagram (Mermaid) with candidate reinforcing/balancing loops and leverage points.",
        inputSchema: inputShape,
    };
    server.registerTool("systems.map", config, handler);
    server.registerTool("systems_map", config, handler);
}
