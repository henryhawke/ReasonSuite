import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";

const ArgsSchema = z.object({
    source_domain: z.string(),
    target_problem: z.string(),
    constraints: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerAnalogicalPrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { source_domain, target_problem, constraints } = extra?.params ?? {};
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Act as an analogy architect.\n\nSOURCE DOMAIN:\n${source_domain}\n\nTARGET PROBLEM:\n${target_problem}\n\nCONSTRAINTS OR MUST-HAVES:\n${constraints ?? "(none provided)"}\n\nSteps to follow:\n1. Identify the core entities, relationships, and dynamics in the source domain.\n2. Map each relevant source element to the most plausible target counterpart and justify the mapping.\n3. List structural relations that transfer cleanly.\n4. Flag mismatches or missing components that could break the analogy.\n5. Summarize transferable_insights and highlight failure_modes or cautionary tales.\n\nRespond with strict JSON matching:\n{"mapping":[{"source":"...","target":"...","justification":"..."}],"shared_relations":["..."],"mismatches":["..."],"transferable_insights":["..."],"failure_modes":["..."]}\nNo additional explanation outside the JSON payload.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "analogical.map",
        {
            title: "Analogical Mapping",
            description: "Map structure from source to target",
            argsSchema: argsShape as any,
        },
        callback
    );
}
