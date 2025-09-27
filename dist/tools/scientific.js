import { z } from "zod";
import { textResult } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
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
        const { goal, context, allow_tools } = rawArgs;
        const prompt = `You are an agent following a Scientific Analytic Framework.
Goal: ${goal}
Context: ${context ?? ""}

Deliberation steps:
1. Decomposition – break the goal into manageable sub-problems or questions.
2. Hypotheses – list candidate explanations or solution directions to test.
3. Tests – propose concrete experiments, code executions, constraint checks, or observations (prefer tool calls if allow_tools is true).
4. Verification – describe how falsification or validation will occur (Popper style).
5. Answer – deliver the best current conclusion with caveats.

Prefer simpler explanations (Occam/MDL). If tools are allowed: propose concrete checks (unit tests, Z3 constraints, code run).

${STRICT_JSON_REMINDER}

JSON schema to emit:
{
  "decomposition": ["..."],
  "hypotheses": ["..."],
  "tests": ["tool/check to run"],
 "verification": {"strategy":"...","popper_falsification":"..."},
 "answer": "final"
}
Return only that JSON object.`;
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
