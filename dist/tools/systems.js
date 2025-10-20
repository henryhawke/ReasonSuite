import { z } from "zod";
import { jsonResult, textResult } from "../lib/mcp.js";
import { normalizeToolInput } from "../lib/args.js";
import { buildStructuredPrompt } from "../lib/prompt.js";
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
        // Validate and apply defaults to input arguments
        const parsed = InputSchema.safeParse(normalizeToolInput(rawArgs));
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for systems.map", issues: parsed.error.issues });
        }
        const { variables = [], context } = parsed.data;
        const prompt = buildStructuredPrompt({
            mode: "Systems mapping",
            objective: "Produce a concise causal loop diagram with leverage analysis.",
            inputs: {
                variables: variables.join(", ") || "(discover relevant variables)",
                context,
            },
            steps: [
                "Draft a Mermaid graph string capturing dominant feedback structure (use LR orientation).",
                "List reinforcing and balancing loops with node order.",
                "Identify leverage_points that shift system behaviour.",
                "Provide stock_flow_hints covering stocks plus inflows/outflows.",
                "Record key assumptions and major risks/failure modes.",
            ],
            schema: '{"mermaid":"","loops":[{"type":"reinforcing","nodes":[]}],"leverage_points":[],"stock_flow_hints":[{"stock":"","inflows":[],"outflows":[]}],"assumptions":[],"risks":[]}',
        });
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 520,
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
