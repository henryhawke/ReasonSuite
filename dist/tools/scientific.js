import { z } from "zod";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    goal: z.string().describe("Problem to solve"),
    context: z.string().optional(),
    allow_tools: z.boolean().default(true),
});
const inputSchema = InputSchema;
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
    const handler = async ({ goal, context, allow_tools }) => {
        const prompt = `You are an agent following a Scientific Analytic Framework.
Goal: ${goal}
Context: ${context ?? ""}

Produce strict JSON only:
{
  "decomposition": ["..."],
  "hypotheses": ["..."],
  "tests": ["tool/check to run"],
 "verification": {"strategy":"...","popper_falsification":"..."},
 "answer": "final"
}
Prefer simpler explanations (Occam/MDL). If tools are allowed: propose concrete checks (unit tests, Z3 constraints, code run).`;
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 900,
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
        return { content: [{ type: "text", text }] };
    };
    const config = {
        title: "Scientific Analytic Framework",
        description: "Decompose, hypothesize, test with tools, and verify (Popperian falsification).",
        inputSchema,
    };
    const wrap = (h) => (args, _extra) => h(args);
    server.registerTool("reasoning.scientific", config, wrap(handler));
    server.registerTool("reasoning_scientific", config, wrap(handler));
    server.registerTool("reasoning-scientific", config, wrap(handler));
}
