import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_REMINDER } from "../lib/prompt.js";

const ArgsSchema = z.object({
    topic: z.string(),
    depth: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerSocraticPrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { topic, depth } = extra?.params ?? {};
        const layers = depth ?? "3";
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Generate a Socratic questioning tree.\n\nTopic:\n${topic}\nDesired depth (layers): ${layers}\n\nDeliberation steps:\n1. For each layer from 1 to ${layers}, list probing questions that deepen understanding of the topic.\n   - Layer 1 clarifies scope and definitions.\n   - Deeper layers challenge assumptions and evidence.\n2. Summarise assumptions_to_test exposed by the questioning.\n3. Recommend evidence_to_collect.\n4. Suggest next_actions to close knowledge gaps.\n${STRICT_JSON_REMINDER}\n\nJSON schema to emit:\n{"layers":[{"level":1,"questions":["..."]}],"assumptions_to_test":["..."],"evidence_to_collect":["..."],"next_actions":["..."]}\nReturn only that JSON object.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "socratic.tree",
        {
            title: "Socratic Tree",
            description: "Generate multi-layer probing questions + assumptions/evidence",
            argsSchema: argsShape as any,
        },
        callback
    );
}
