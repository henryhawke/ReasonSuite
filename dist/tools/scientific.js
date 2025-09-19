import { z } from "zod";
export function registerScientific(server) {
    server.registerTool("reasoning.scientific", {
        title: "Scientific Analytic Framework",
        description: "Decompose, hypothesize, test with tools, and verify (Popperian falsification).",
        inputSchema: {
            goal: z.string().describe("Problem to solve"),
            context: z.string().optional(),
            allow_tools: z.boolean().default(true),
        },
    }, async ({ goal, context, allow_tools }) => {
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
        try {
            const resp = await server.server.createMessage({
                messages: [{ role: "user", content: { type: "text", text: prompt } }],
                maxTokens: 900,
            });
            const out = resp.content.type === "text" ? resp.content.text : "{}";
            return { content: [{ type: "text", text: out }] };
        }
        catch {
            const fallback = {
                decomposition: ["understand requirements", "identify invariants"],
                hypotheses: ["H1 minimal", "H2 alternative"],
                tests: ["unit:test", "z3:constraint"],
                verification: { strategy: "run tests", popper_falsification: "seek counterexample" },
                answer: "draft",
            };
            return { content: [{ type: "text", text: JSON.stringify(fallback, null, 2) }] };
        }
    });
}
