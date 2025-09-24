import { z } from "zod";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    topic: z.string(),
    context: z.string().optional(),
    depth: z.number().int().min(1).max(6).default(3),
});
const inputSchema = InputSchema;
const OutputSchema = z
    .object({
    layers: z.array(z.object({ level: z.number().int(), questions: z.array(z.string()).default([]) })).default([]),
    assumptions_to_test: z.array(z.string()).default([]),
    evidence_to_collect: z.array(z.string()).default([]),
    next_actions: z.array(z.string()).default([]),
})
    .extend({ meta: ReasoningMetadataSchema.optional() });
export function registerSocratic(server) {
    const handler = async ({ topic, context, depth }) => {
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
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 600,
            schema: OutputSchema,
            fallback: () => {
                const baseDepth = Math.min(Math.max(depth ?? 3, 1), 6);
                return {
                    layers: Array.from({ length: baseDepth }, (_, idx) => ({
                        level: idx + 1,
                        questions: idx === 0
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
        return { content: [{ type: "text", text }] };
    };
    const config = {
        title: "Socratic inquiry",
        description: "Generate a structured series of probing questions to clarify scope, assumptions, and evidence.",
        inputSchema,
    };
    const wrap = (h) => (args, _extra) => h(args);
    server.registerTool("socratic.inquire", config, wrap(handler));
    server.registerTool("socratic_inquire", config, wrap(handler));
    server.registerTool("socratic-inquire", config, wrap(handler));
}
