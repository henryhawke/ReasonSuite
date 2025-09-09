import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerDialectic(server: McpServer): void {
    server.registerTool(
        "dialectic.tas",
        {
            title: "Dialectic (Thesis–Antithesis–Synthesis)",
            description:
                "Given a claim, produce thesis, antithesis, and synthesis with evidence requests.",
            inputSchema: {
                claim: z.string(),
                context: z.string().optional(),
                audience: z.string().default("general"),
            },
        },
        async ({ claim, context, audience }) => {
            const prompt = `Use a dialectical frame.
Claim: ${claim}
Context: ${context ?? ""}
Audience: ${audience}

Return strict JSON only:
{
 "thesis": {"position": "...", "key_points": ["..."]},
 "antithesis": {"position": "...", "key_points": ["..."]},
 "synthesis": {"proposal": "...", "assumptions": ["..."], "tradeoffs": ["..."], "evidence_needed": ["..."]},
 "open_questions": ["..."]
}`;
            const resp = await server.server.createMessage({
                messages: [{ role: "user", content: { type: "text", text: prompt } }],
                maxTokens: 700,
            });
            const out = resp.content.type === "text" ? resp.content.text : "{}";
            return { content: [{ type: "text", text: out }] };
        }
    );
}


