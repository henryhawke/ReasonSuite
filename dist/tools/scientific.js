import { z } from "zod";
import { jsonResult, textResult } from "../lib/mcp.js";
import { normalizeToolInput } from "../lib/args.js";
import { buildStructuredPrompt } from "../lib/prompt.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    goal: z.string().describe("Problem to solve"),
    context: z.string().optional(),
    allow_tools: z.boolean().default(true),
});
const inputSchema = InputSchema.shape;
const OutputSchema = z
    .object({
    decomposition: z.array(z.string()).default([]),
    hypotheses: z.array(z.string()).default([]),
    tests: z.array(z.string()).default([]),
    verification: z.object({
        strategy: z.string(),
        popper_falsification: z.string(),
    }),
    answer: z.string(),
})
    .extend({ meta: ReasoningMetadataSchema.optional() });
export function registerScientific(server) {
    const handler = async (rawArgs, _extra) => {
        const parsed = InputSchema.safeParse(normalizeToolInput(rawArgs));
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for reasoning.scientific", issues: parsed.error.issues });
        }
        const { goal, context, allow_tools } = parsed.data;
        const prompt = buildStructuredPrompt({
            mode: "Scientific method",
            objective: "Decompose the goal, test hypotheses, and report falsification path.",
            inputs: { goal, context, allow_tools: allow_tools ? "true" : "false" },
            steps: [
                "Decomposition: break the goal into sub-questions.",
                "Hypotheses: list candidate explanations or solution directions.",
                allow_tools
                    ? "Tests: propose experiments or tool calls (unit, z3, exec, etc.)."
                    : "Tests: propose conceptual checks or observations without tools.",
                "Verification: explain falsification or validation (Popper style).",
                "Answer: deliver best conclusion with caveats.",
            ],
            extras: ["Prefer simpler explanations (Occam/MDL)."],
            schema: '{"decomposition":[],"hypotheses":[],"tests":[],"verification":{"strategy":"","popper_falsification":""},"answer":""}',
        });
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 480,
            schema: OutputSchema,
            fallback: () => ({
                decomposition: ["Understand requirements", "List governing constraints"],
                hypotheses: ["H1: Minimal viable approach", "H2: Alternative for edge cases"],
                tests: allow_tools
                    ? ["unit:cover critical functions", "z3:model invariants", "exec:quick simulation"]
                    : ["thought experiment", "manual consistency check"],
                verification: {
                    strategy: allow_tools ? "Execute proposed tests" : "Seek peer/expert review",
                    popper_falsification: "Identify counterexample that would invalidate the answer",
                },
                answer: "Deterministic scaffold—rerun with sampling for richer details.",
            }),
        });
        return textResult(text);
    };
    const config = {
        title: "Scientific Analytic Framework",
        description: "Decompose, hypothesize, test with tools, and verify (Popperian falsification).",
        inputSchema: inputSchema,
    };
    server.registerTool("reasoning.scientific", config, handler);
    // Back-compat alias
    server.registerTool("reasoning_scientific", { title: config.title, description: "Alias for reasoning.scientific (back-compat)." }, handler);
}
