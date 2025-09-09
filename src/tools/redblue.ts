import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerRedBlue(server: McpServer): void {
    server.registerTool(
        "redblue.challenge",
        {
            title: "Red vs Blue critique",
            description:
                "Run N rounds of adversarial challenge/defense on a proposal or answer. Returns a transcript + defects + risk matrix.",
            inputSchema: {
                proposal: z.string(),
                rounds: z.number().int().min(1).max(5).default(2),
                focus: z.array(z.string()).default(["safety", "bias", "hallucination", "security", "privacy"]),
            },
        },
        async ({ proposal, rounds, focus }) => {
            const prompt = `Conduct ${rounds} rounds of Red (attack) vs Blue (defense) on:
${proposal}

Focus areas: ${focus.join(", ")}.
Return strict JSON only:
{
 "rounds":[
   {"n":1,"red":{"attack":"..."}, "blue":{"defense":"...","mitigations":["..."]}}
 ],
 "defects":[{"type":"...","severity":"low|med|high","evidence":"..."}],
 "risk_matrix":{"low":[],"medium":[],"high":[]},
 "final_guidance":["..."]
}`;
            const resp = await server.server.createMessage({
                messages: [{ role: "user", content: { type: "text", text: prompt } }],
                maxTokens: 900,
            });
            return { content: [{ type: "text", text: resp.content.type === "text" ? resp.content.text : "{}" }] };
        }
    );
}


