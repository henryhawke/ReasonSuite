import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerSocratic(server: McpServer): void {
    server.registerTool(
        "socratic.inquire",
        {
            title: "Socratic inquiry",
            description:
                "Generate a structured series of probing questions to clarify scope, assumptions, and evidence.",
            inputSchema: {
                topic: z.string(),
                context: z.string().optional(),
                depth: z.number().int().min(1).max(6).default(3),
            },
        },
        async ({ topic, context, depth }) => {
            const prompt = `Produce a ${depth}-layer Socratic question tree for: "${topic}"
Context: ${context ?? ""}
Return strict JSON only:
{
 "layers": [
   {"level": 1, "questions": ["..."]},
   {"level": 2, "questions": ["..."]}
 ],
 "assumptions_to_test": ["..."],
 "evidence_to_collect": ["..."],
 "next_actions": ["..."]
}`;
            const resp = await server.server.createMessage({
                messages: [{ role: "user", content: { type: "text", text: prompt } }],
                maxTokens: 600,
            });
            return { content: [{ type: "text", text: resp.content.type === "text" ? resp.content.text : "{}" }] };
        }
    );
}


