import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_COMPACT } from "../lib/prompt.js";
const ArgsSchema = z.object({
    variables: z.string().optional(),
    context: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerSystemsPrompts(server) {
    const callback = ((extra) => {
        const { variables, context } = extra?.params ?? {};
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Construct a concise causal loop diagram (CLD).\n\nKnown variables or factors:\n${variables ?? "(discover relevant variables)"}\nContext:\n${context ?? "(no extra context)"}\n\nDeliberation steps:\n1. Draft a Mermaid graph string that captures the dominant feedback structure (use LR orientation).\n2. List reinforcing and balancing loops with node names in order.\n3. Identify leverage_points that could shift system behaviour.\n4. Provide stock_flow_hints describing stocks plus inflows/outflows.\n5. Record key assumptions and major risks or failure modes.\n${STRICT_JSON_COMPACT}\n\nJSON schema to emit:\n{"mermaid":"graph LR; ...","loops":[{"type":"reinforcing","nodes":["..."]}],"leverage_points":["..."],"stock_flow_hints":[{"stock":"...","inflows":["..."],"outflows":["..."]}],"assumptions":["..."],"risks":["..."]}\nReturn only that JSON object.`,
                    },
                },
            ],
        };
    });
    server.registerPrompt("systems.map", {
        title: "Systems Map (CLD)",
        description: "Mermaid CLD + loops + leverage points",
        argsSchema: argsShape,
    }, callback);
}
