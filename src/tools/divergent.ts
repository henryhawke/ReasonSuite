import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerDivergent(server: McpServer): void {
    const config = {
        title: "Divergent–Convergent Creative",
        description: "Generate multiple options (divergent), then evaluate and converge with criteria (convergent).",
        inputSchema: {
            prompt: z.string(),
            k: z.number().int().min(2).max(10).default(5),
            criteria: z.array(z.string()).default(["novelty", "consistency", "relevance"]),
        },
    };
    const handler = async ({ prompt, k, criteria }: { prompt: string; k: number; criteria: string[] }) => {
        const text = `Divergent then Convergent.
Task: ${prompt}
Candidates: ${k}
Criteria: ${criteria.join(", ")}

Return strict JSON only:
{
  "divergent": ["idea1","idea2",...],
  "scores": [{"id":1,"by":{"novelty":0.7,"consistency":0.6,"relevance":0.8},"notes":"..."}],
  "winner": {"id": 1, "why": "..."},
  "synthesis": "refined solution"
}`;
        try {
            const resp = await server.server.createMessage({
                messages: [{ role: "user", content: { type: "text", text } }],
                maxTokens: 900,
            });
            const out = resp.content.type === "text" ? resp.content.text : "{}";
            return { content: [{ type: "text", text: out }] };
        } catch {
            const fallback = {
                divergent: ["A", "B", "C"],
                scores: [{ id: 1, by: { novelty: 0.6, consistency: 0.7, relevance: 0.8 }, notes: "ok" }],
                winner: { id: 1, why: "balanced" },
                synthesis: "C'",
            };
            return { content: [{ type: "text", text: JSON.stringify(fallback, null, 2) }] };
        }
    };
    server.registerTool("reasoning.divergent_convergent", config as any, handler as any);
    server.registerTool("reasoning_divergent_convergent", config as any, handler as any);
}



