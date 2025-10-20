import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult, textResult, type ToolCallback } from "../lib/mcp.js";
import { normalizeToolInput } from "../lib/args.js";
import { buildStructuredPrompt } from "../lib/prompt.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";

const InputSchema = z.object({
    topic: z.string(),
    context: z.string().optional(),
    depth: z.number().int().min(1).max(6).default(3),
});

const inputSchema = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

const OutputSchema = z
    .object({
        layers: z.array(z.object({ level: z.number().int(), questions: z.array(z.string()).default([]) })).default([]),
        assumptions_to_test: z.array(z.string()).default([]),
        evidence_to_collect: z.array(z.string()).default([]),
        next_actions: z.array(z.string()).default([]),
    })
    .extend({ meta: ReasoningMetadataSchema.optional() });

export function registerSocratic(server: McpServer): void {
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        const parsed = InputSchema.safeParse(normalizeToolInput(rawArgs));
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for socratic.inquire", issues: parsed.error.issues });
        }
        const { topic, context, depth } = parsed.data;
        const prompt = buildStructuredPrompt({
            mode: "Socratic inquiry",
            objective: `Build a ${depth}-layer question tree to clarify the topic and next steps.`,
            inputs: { topic, context, depth: String(depth) },
            steps: [
                `For each layer 1…${depth}, list probing questions (layer 1 clarifies scope, deeper layers challenge assumptions/evidence).`,
                "Summarise assumptions_to_test exposed by questioning.",
                "Recommend evidence_to_collect.",
                "Suggest next_actions to close knowledge gaps.",
            ],
            schema:
                '{"layers":[{"level":1,"questions":[]}],"assumptions_to_test":[],"evidence_to_collect":[],"next_actions":[]}',
        });
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 360,
            schema: OutputSchema,
            fallback: () => {
                const baseDepth = Math.min(Math.max(depth ?? 3, 1), 6);
                return {
                    layers: Array.from({ length: baseDepth }, (_, idx) => ({
                        level: idx + 1,
                        questions:
                            idx === 0
                                ? [
                                    `What exactly counts as success for "${topic}"?`,
                                    "Which stakeholders or constraints might we be missing?",
                                ]
                                : ["What evidence would confirm or refute prior answers?"],
                    })),
                    assumptions_to_test: ["Clarify hidden premises", "Check context-specific caveats"],
                    evidence_to_collect: ["Gather domain facts", "Consult primary stakeholders"],
                    next_actions: ["Summarize answers", "Decide which reasoning tool to run next"],
                };
            },
        });
        return textResult(text);
    };

    const config = {
        title: "Socratic inquiry",
        description: "Generate a structured series of probing questions to clarify scope, assumptions, and evidence.",
        inputSchema: inputSchema,
    } as const;

    server.registerTool("socratic.inquire", config, handler);
    // Back-compat alias
    server.registerTool(
        "socratic_inquire",
        { title: config.title, description: "Alias for socratic.inquire (back-compat)." },
        handler
    );
}
