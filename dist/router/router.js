import { z } from "zod";
import { textResult } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
import { DEFAULT_RAZORS } from "../lib/razors.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
import { buildFallback as selectorFallback } from "../tools/selector.js";
const ModeSchema = z.enum([
    "socratic",
    "abductive",
    "razors.apply",
    "systems",
    "analogical",
    "constraint",
    "redblue",
    "dialectic",
    "scientific",
    "self_explain",
    "divergent",
    "exec",
]);
const StepSchema = z.object({
    mode: ModeSchema,
    tool: z.string().optional(),
    why: z.string(),
    args: z.record(z.string(), z.unknown()).default({}),
});
const PlanSchema = z
    .object({
    steps: z.array(StepSchema).default([]),
    notes: z.string().optional(),
})
    .extend({ meta: ReasoningMetadataSchema.optional() });
const InputSchema = z.object({
    task: z.string().describe("User task or question"),
    context: z.string().optional(),
    maxSteps: z.number().int().positive().max(8).default(4),
});
const inputShape = InputSchema;
const SIGNAL_DESCRIPTIONS = {
    needsHypotheses: "Diagnosis / uncertainty cues detected → schedule abductive.hypothesize to explore explanations.",
    needsCreative: "Creative or brainstorming language detected → add reasoning.divergent_convergent for option generation.",
    needsSystems: "Systemic / feedback terminology detected → include systems.map to surface loops and leverage points.",
    needsConstraint: "Constraint or optimisation keywords detected → include constraint.solve for feasibility checking.",
    needsRisk: "Risk, safety, or abuse terms detected → run redblue.challenge before finalising outcomes.",
    contested: "Controversy or trade-off language detected → use dialectic.tas to examine opposing positions.",
    wantsAnalogy: "Analogy or comparison cues detected → include analogical.map to transfer structure carefully.",
    needsScientific: "Experiment / evidence requests detected → include reasoning.scientific for test planning.",
    wantsSelfExplain: "Transparency / rationale requests detected → finish with reasoning.self_explain.",
    codeOrCalc: "Code or computation keywords detected → schedule exec.run for sandboxed verification.",
    deepScope: "Complex strategy / roadmap wording detected → use a deeper socratic.inquire depth setting.",
};
export function registerRouter(server) {
    const handler = async (rawArgs, _extra) => {
        const { task, context, maxSteps } = rawArgs;
        const signals = detectSignals(task, context);
        const heuristicsList = summarizeSignals(signals);
        const heuristicsBlock = heuristicsList.length
            ? heuristicsList.map((entry) => `- ${entry}`).join("\n")
            : "- No strong automatic signals detected; default to Socratic clarification first.";
        const modeReference = [
            "socratic.inquire — clarify scope, assumptions, and success criteria (usually first)",
            "abductive.hypothesize — generate and rank explanations when the cause is uncertain",
            "razors.apply — prune or revise ideas using Occam/Hitchens/Popper-style tests",
            "systems.map — map feedback loops, stocks/flows, and leverage points",
            "analogical.map — transfer structure across domains while flagging mismatches",
            "constraint.solve — check feasibility against numeric or logical limits",
            "redblue.challenge — stress-test for safety, bias, or attack scenarios",
            "dialectic.tas — analyse thesis vs antithesis and reconcile trade-offs",
            "reasoning.scientific — decompose goals, plan experiments, and verify evidence",
            "reasoning.self_explain — produce transparent rationale, evidence, critique, revision",
            "reasoning.divergent_convergent — brainstorm options then converge with scoring",
            "exec.run — execute sandboxed JavaScript for quick calculations or prototypes",
        ].join("\n");
        const prompt = `You are a planning assistant that selects reasoning tools for an autonomous analyst.

Mode quick reference (tool → cue):
${modeReference}

Heuristic signals detected for this request:
${heuristicsBlock}

Task: ${task}
Context: ${context ?? "(none)"}

Planning rules:
- Limit the plan to ${maxSteps} steps.
- Always begin with socratic.inquire unless the question is already fully specified.
- Whenever you add abductive or divergent steps, schedule razors.apply immediately afterwards.
- Insert redblue.challenge before final answers when risk, safety, or deployment concerns appear.
- Provide short "why" rationales and populate args as JSON objects (use {} when no parameters are needed).
- Use notes to flag limitations, dependencies, or follow-up actions in one sentence.

Deliberation steps:
1. Summarize the goal/context internally and check if socratic clarification is still needed.
2. Evaluate each heuristic signal and decide which modes are essential within the ${maxSteps}-step cap.
3. Sequence the modes so clarifying/creative steps precede evaluation, and verification/risk steps precede conclusions.
4. Fill args with the minimal structured parameters each tool needs (e.g., depth for socratic, focus arrays for redblue).
5. Confirm razors.apply follows any hypothesis/ideation generator and avoid duplicate modes unless justified.

${STRICT_JSON_REMINDER}

JSON schema to emit:
{
  "steps": [
    {"mode":"...","tool":"tool.id","why":"...","args":{}}
  ],
  "notes": "one-line on expected limitations"
}
Return only that JSON object.`;
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 600,
            schema: PlanSchema,
            fallback: () => buildHeuristicPlan(task, context, maxSteps),
        });
        return textResult(text);
    };
    server.registerTool("reasoning.router.plan", {
        title: "Plan reasoning approach",
        description: "Given a task, propose an ordered plan of reasoning modes with brief rationale. Modes include dialectic, socratic, abductive, systems, redblue, analogical, constraint, razors.apply, scientific, self_explain, divergent, exec.",
        inputSchema: inputShape,
    }, handler);
}
function detectSignals(task, context) {
    const normalized = `${task} ${context ?? ""}`.toLowerCase();
    const contains = (pattern) => pattern.test(normalized);
    return {
        needsHypotheses: contains(/diagnos|root cause|why|uncertain|hypothesis|investigat|anomal/),
        needsCreative: contains(/brainstorm|idea|innov|option|alternativ|explore/),
        needsSystems: contains(/system|feedback|loop|dynamics|ecosystem|supply|demand|stock|flow/),
        needsConstraint: contains(/constraint|optimi[sz]e|allocate|schedule|budget|limit|maximize|minimize|>=|<=|\b\d+/),
        needsRisk: contains(/risk|safety|security|privacy|abuse|attack|hazard|failure|compliance|bias/),
        contested: contains(/trade-?off|controvers|policy|ethic|disagree|stakeholder|debate/),
        wantsAnalogy: contains(/analogy|analog|similar to|compare|precedent|case study/),
        needsScientific: contains(/experiment|test|measurement|data|evidence|validate/),
        wantsSelfExplain: contains(/explain|rationale|justify|transparent|walkthrough/),
        codeOrCalc: contains(/code|script|function|regex|compute|calculate|algorithm|typescript|javascript|json/),
        deepScope: contains(/complex|strategy|roadmap/),
    };
}
function summarizeSignals(signals) {
    return Object.entries(signals)
        .filter(([, active]) => active)
        .map(([key]) => SIGNAL_DESCRIPTIONS[key]);
}
function buildHeuristicPlan(task, context, maxSteps) {
    const signals = detectSignals(task, context);
    const steps = [];
    const push = (step) => {
        if (steps.length >= maxSteps)
            return;
        steps.push(step);
    };
    push({
        mode: "socratic",
        tool: "socratic.inquire",
        why: "Clarify scope, success criteria, and hidden assumptions",
        args: { depth: signals.deepScope ? 3 : 2 },
    });
    if (signals.needsCreative) {
        push({
            mode: "divergent",
            tool: "reasoning.divergent_convergent",
            why: "Expand the option space before converging with explicit criteria",
            args: { prompt: task, k: Math.min(5, Math.max(3, maxSteps)) },
        });
    }
    if (signals.needsHypotheses) {
        push({
            mode: "abductive",
            tool: "abductive.hypothesize",
            why: "Generate and score candidate explanations",
            args: { k: signals.needsCreative ? 5 : 4, apply_razors: [...DEFAULT_RAZORS] },
        });
    }
    if (signals.needsSystems) {
        push({
            mode: "systems",
            tool: "systems.map",
            why: "Map feedback loops and leverage points",
            args: { variables: [] },
        });
    }
    if (signals.wantsAnalogy) {
        push({
            mode: "analogical",
            tool: "analogical.map",
            why: "Transfer structure from analogous domains while flagging mismatches",
            args: {},
        });
    }
    if (signals.needsConstraint) {
        push({
            mode: "constraint",
            tool: "constraint.solve",
            why: "Check feasibility against formal constraints or optimisation goals",
            args: { model_json: "" },
        });
    }
    if (signals.needsScientific) {
        push({
            mode: "scientific",
            tool: "reasoning.scientific",
            why: "Design falsifiable tests and evidence checks",
            args: { allow_tools: true },
        });
    }
    if (signals.codeOrCalc) {
        push({
            mode: "exec",
            tool: "exec.run",
            why: "Prototype or verify small computations in a sandbox",
            args: { timeout_ms: 1500 },
        });
    }
    if (signals.wantsSelfExplain) {
        push({
            mode: "self_explain",
            tool: "reasoning.self_explain",
            why: "Produce transparent rationale, citations, and self-critique",
            args: { allow_citations: true },
        });
    }
    if (signals.contested) {
        push({
            mode: "dialectic",
            tool: "dialectic.tas",
            why: "Surface thesis/antithesis and synthesize trade-offs",
            args: { audience: "general" },
        });
    }
    if (signals.needsRisk) {
        push({
            mode: "redblue",
            tool: "redblue.challenge",
            why: "Stress-test for failure modes and mitigations before deployment",
            args: { rounds: Math.min(3, Math.max(1, maxSteps - steps.length || 1)), focus: ["safety", "security", "bias"] },
        });
    }
    const generatorUsed = steps.some((step) => step.mode === "abductive" || step.mode === "divergent");
    if (generatorUsed) {
        push({
            mode: "razors.apply",
            tool: "razors.apply",
            why: "Prune or revise options using MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, and Popper tests",
            args: { razors: [...DEFAULT_RAZORS] },
        });
    }
    if (!steps.some((step) => step.mode === "dialectic") && signals.contested && steps.length < maxSteps) {
        push({
            mode: "dialectic",
            tool: "dialectic.tas",
            why: "Synthesize trade-offs before final decision",
            args: { audience: "general" },
        });
    }
    if (steps.length === 1 && steps[0].mode === "socratic") {
        const selector = selectorFallback(task, context, [
            "abductive",
            "systems",
            "constraint",
            "redblue",
            "dialectic",
            "analogical",
            "scientific",
            "divergent",
            "exec",
            "razors.apply",
            "self_explain",
            "socratic",
        ], [...DEFAULT_RAZORS]);
        const nextId = selector.primary_mode.id; // prefer the selector suggestion
        if (nextId && nextId !== "socratic") {
            const toolMap = {
                abductive: "abductive.hypothesize",
                systems: "systems.map",
                constraint: "constraint.solve",
                redblue: "redblue.challenge",
                dialectic: "dialectic.tas",
                analogical: "analogical.map",
                scientific: "reasoning.scientific",
                divergent: "reasoning.divergent_convergent",
                exec: "exec.run",
                "razors.apply": "razors.apply",
                self_explain: "reasoning.self_explain",
                socratic: "socratic.inquire",
            };
            push({
                mode: nextId,
                tool: toolMap[nextId] ?? undefined,
                why: selector.primary_mode.reason ?? "Selector heuristic recommendation",
                args: {},
            });
        }
        else {
            push({
                mode: "scientific",
                tool: "reasoning.scientific",
                why: "Structure the next investigative steps when no other heuristic fired",
                args: { allow_tools: true },
            });
        }
    }
    const triggered = summarizeSignals(signals);
    return {
        steps,
        notes: triggered.length > 0
            ? `Heuristic fallback triggered: ${triggered.join("; ")}.`
            : "Heuristic fallback generated from keyword analysis; rerun with sampling for nuance.",
    };
}
