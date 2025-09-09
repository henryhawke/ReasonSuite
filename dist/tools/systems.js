import { z } from "zod";
export function registerSystems(server) {
    server.registerTool("systems.map", {
        title: "Systems map (CLD)",
        description: "Create a causal loop diagram (Mermaid) with candidate reinforcing/balancing loops and leverage points.",
        inputSchema: {
            variables: z.array(z.string()).describe("Known variables").default([]),
            context: z.string().optional(),
        },
    }, async ({ variables, context }) => {
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
        const resp = await server.server.createMessage({
            messages: [{ role: "user", content: { type: "text", text: prompt } }],
            maxTokens: 1000,
        });
        return { content: [{ type: "text", text: resp.content.type === "text" ? resp.content.text : "{}" }] };
    });
}
