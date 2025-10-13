import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_COMPACT } from "../lib/prompt.js";

const ArgsSchema = z.object({
    goal: z.string(),
    context: z.string().optional(),
    allow_tools: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerScientificPrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { goal, context, allow_tools } = extra?.params ?? {};
        const toolsFlag = allow_tools ?? "true";
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Follow the ReasonSuite scientific analysis cadence.\n\nGoal:\n${goal}\n\nContext or known constraints:\n${context ?? "(none)"}\nTools allowed now? ${toolsFlag}\n\nDeliberation steps:\n1. Decomposition – break the goal into manageable sub-problems or questions.\n2. Hypotheses – list candidate explanations or solution directions to test.\n3. Tests – propose concrete experiments, code executions, constraint checks, or observations (prefer tool calls if allow_tools is true).\n4. Verification – describe how falsification or validation will occur (Popper style).\n5. Answer – deliver the best current conclusion with caveats.\n${STRICT_JSON_COMPACT}\n\nJSON schema to emit:\n{"decomposition":["..."],"hypotheses":["..."],"tests":["..."],"verification":{"strategy":"...","popper_falsification":"..."},"answer":"..."}\nReturn only that JSON object.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "reasoning.scientific",
        {
            title: "Scientific Analytic",
            description: "Decompose → hypothesize → test → verify",
            argsSchema: argsShape as any,
        },
        callback
    );
}
