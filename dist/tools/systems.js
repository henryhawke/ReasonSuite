import { z } from "zod";
import { textResult } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    variables: z.array(z.string()).describe("Known variables").default([]),
    context: z.string().optional(),
});
const inputSchema = InputSchema.shape;
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
    const handler = async (rawArgs, _extra) => {
        const { variables, context } = rawArgs;
        const prompt = `Build a concise causal loop diagram (CLD) for the system below.
Variables: ${variables.join(", ") || "(discover reasonable variables)"}
Context: ${context ?? ""}

Deliberation steps:
1. Draft a Mermaid graph string that captures the dominant feedback structure (use LR orientation).
2. List reinforcing and balancing loops with node names in order.
3. Identify leverage_points that could shift system behaviour.
4. Provide stock_flow_hints describing stocks plus inflows/outflows.
5. Record key assumptions and major risks or failure modes.

${STRICT_JSON_REMINDER}

JSON schema to emit:
{
 "mermaid":"graph LR; A-->B; B-.-|neg|C; ...",
 "loops":[{"type":"reinforcing","nodes":["..."]},{"type":"balancing","nodes":["..."]}],
 "leverage_points":["rules","information_flow","goals","paradigms"],
 "stock_flow_hints":[{"stock":"...","inflows":["..."],"outflows":["..."]}],
 "assumptions":["..."],
 "risks":["..."]
}
Return only that JSON object.`;
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
        return textResult(text);
    };
    const config = {
        title: "Systems map (CLD)",
        description: "Create a causal loop diagram (Mermaid) with candidate reinforcing/balancing loops and leverage points.",
        inputSchema: inputSchema,
    };
    server.registerTool("systems.map", config, handler);
    // Back-compat alias
    server.registerTool("systems_map", { title: config.title, description: "Alias for systems.map (back-compat)." }, handler);
}
