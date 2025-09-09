import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerRouter(server: McpServer): void {
    server.registerTool(
        "reasoning.router.plan",
        {
            title: "Plan reasoning approach",
            description:
                "Given a task, propose an ordered plan of reasoning modes with brief rationale. Modes: dialectic, socratic, abductive, systems, redblue, analogical, constraint, razors.apply. Returns JSON.",
            inputSchema: {
                task: z.string().describe("User task or question"),
                context: z.string().optional(),
                maxSteps: z.number().int().positive().max(8).default(4),
            },
        },
        async ({ task, context, maxSteps }) => {
            let planText: string | null = null;
            try {
                const resp = await server.server.createMessage({
                    messages: [
                        {
                            role: "user",
                            content: {
                                type: "text",
                                text: `You are a planner. Available modes: dialectic, socratic, abductive, systems, redblue, analogical, constraint, razors.apply.
Task: ${task}
Context: ${context ?? ""}

Output as strict JSON only, no prose:
{
  "steps": [{"mode":"...", "why":"...", "args":{}}],
  "notes": "one line on expected limitations"
}
Limit steps to ${maxSteps}. Prefer constraint when explicit numeric/logical constraints exist; prefer systems when many interacting variables; prefer abductive for incomplete data; use razors.apply after hypothesis lists; add redblue before finalization for safety; use analogical if helpful transfer exists; use dialectic when controversy/policy/value trade-offs; start with socratic for scoping.`,
                            },
                        },
                    ],
                    maxTokens: 500,
                });
                if (resp.content.type === "text") planText = resp.content.text.trim();
            } catch { }

            const fallback = {
                steps: [
                    { mode: "socratic", why: "Scope the task and unknowns", args: { depth: 2 } },
                    { mode: "abductive", why: "Generate/test leading explanations or options", args: { k: 3 } },
                    { mode: "razors.apply", why: "Prune via MDL/Occam and falsifiability", args: { razors: ["MDL", "Popper"] } },
                ],
                notes: "LLM sampling unavailable; rule-based fallback used.",
            };

            const json = safeParseJSON(planText) ?? fallback;
            return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
        }
    );
}

function safeParseJSON(txt?: string | null) {
    if (!txt) return null;
    try {
        return JSON.parse(txt);
    } catch {
        return null;
    }
}


