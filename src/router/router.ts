import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult, textResult, type ToolCallback } from "../lib/mcp.js";
import { normalizeToolInput } from "../lib/args.js";
import { buildStructuredPrompt } from "../lib/prompt.js";
import { DEFAULT_RAZORS } from "../lib/razors.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
import { buildFallback as selectorFallback } from "../tools/selector.js";
import type { RouterPlan, RouterStep } from "../lib/types.js";
import { SIGNAL_DESCRIPTIONS, type RouterSignals } from "./signals.js";

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

const MODE_ALIASES: Partial<Record<string, z.infer<typeof ModeSchema>>> = {
    razors: "razors.apply",
    razor: "razors.apply",
};

const TOOL_TO_MODE: Partial<Record<string, z.infer<typeof ModeSchema>>> = {
    "socratic.inquire": "socratic",
    "abductive.hypothesize": "abductive",
    "razors.apply": "razors.apply",
    "reasoning.divergent_convergent": "divergent",
    "systems.map": "systems",
    "analogical.map": "analogical",
    "constraint.solve": "constraint",
    "redblue.challenge": "redblue",
    "reasoning.scientific": "scientific",
    "reasoning.self_explain": "self_explain",
    "exec.run": "exec",
};

const MODE_KEYWORD_RULES: Array<{ pattern: RegExp; mode: z.infer<typeof ModeSchema>; weight?: number }> = [
    // Core reasoning modes
    { pattern: /(clarify|scope|question|probe|why|how|when|what if)/i, mode: "socratic", weight: 1.0 },
    { pattern: /(hypoth|explanation|diagnos|root cause|test explanations|investigate|anomaly|incident)/i, mode: "abductive", weight: 1.2 },
    { pattern: /(prune|refine|razor|screen|evaluate|critique|assess|judge|filter)/i, mode: "razors.apply", weight: 1.0 },
    { pattern: /(brainstorm|generate|diverge|ideat|option|alternative|creative|explore)/i, mode: "divergent", weight: 1.0 },

    // Systems & complexity
    { pattern: /(system|feedback|loop|leverage|stock|flow|cascade|ripple|network|interconnect)/i, mode: "systems", weight: 1.1 },
    { pattern: /(analogy|analog|map structure|similar|pattern|comparison|metaphor)/i, mode: "analogical", weight: 1.0 },

    // Optimization & constraints
    { pattern: /(constraint|optimi[sz]|feasible|schedule|budget|limit|resource|allocation|capacity|maximize|minimize)/i, mode: "constraint", weight: 1.2 },

    // Risk & adversarial
    { pattern: /(risk|threat|challenge|red team|attack|vulnerability|exploit|adversary|counter|defense|security)/i, mode: "redblue", weight: 1.1 },

    // Finance & business
    { pattern: /(revenue|profit|cost|pricing|margin|roi|valuation|finance|fiscal|monetary|investment|portfolio)/i, mode: "constraint", weight: 1.1 },
    { pattern: /(market|competition|competitive|strategy|positioning|differentiat|advantage)/i, mode: "dialectic", weight: 1.1 },
    { pattern: /(forecast|projection|growth|trend|metric|kpi|performance|dashboard)/i, mode: "systems", weight: 1.0 },

    // Legal & compliance
    { pattern: /(legal|compliance|regulatory|audit|govern|policy|rule|requirement|mandate|obligat)/i, mode: "razors.apply", weight: 1.2 },
    { pattern: /(liability|risk assessment|due diligence|contract|agreement|terms)/i, mode: "dialectic", weight: 1.1 },

    // Scientific & experimental
    { pattern: /(experiment|scientific|test plan|measure|hypothesis|empirical|data|evidence|validate)/i, mode: "scientific", weight: 1.2 },

    // Analysis & explanation
    { pattern: /(explain|self[-_ ]?explain|rationale|justify|reasoning|logic|argument)/i, mode: "self_explain", weight: 1.0 },
    { pattern: /(debate|argue|claim|counter|thesis|dialectic|position|stance)/i, mode: "dialectic", weight: 1.1 },

    // Technical & execution
    { pattern: /(code|execute|compute|script|run|program|implement|automate)/i, mode: "exec", weight: 1.0 },
];

function determineMode(value: string, tool?: string): z.infer<typeof ModeSchema> {
    const normalizedValue = value.trim().toLowerCase();
    const fallbackMode: z.infer<typeof ModeSchema> = "socratic";

    if (normalizedValue.length === 0) {
        const fromTool = tool ? TOOL_TO_MODE[tool.toLowerCase()] : undefined;
        return fromTool ?? fallbackMode;
    }

    const directAlias = MODE_ALIASES[normalizedValue];
    if (directAlias) {
        return directAlias;
    }

    if (tool) {
        const fromTool = TOOL_TO_MODE[tool.toLowerCase()];
        if (fromTool) {
            return fromTool;
        }
    }

    for (const { pattern, mode } of MODE_KEYWORD_RULES) {
        if (pattern.test(value)) {
            return mode;
        }
    }

    const firstWord = normalizedValue.split(/\s+/)[0] ?? normalizedValue;
    const aliasByFirstWord = MODE_ALIASES[firstWord];
    if (aliasByFirstWord) {
        return aliasByFirstWord;
    }

    return fallbackMode;
}

const StepBaseSchema = z.object({
    mode: z.string(),
    tool: z.string().optional(),
    why: z.string(),
    args: z.record(z.string(), z.unknown()).default({}),
});

const StepSchema = StepBaseSchema.transform((step) => {
    const mode = ModeSchema.parse(determineMode(step.mode, step.tool));
    return {
        ...step,
        mode,
        args: step.args ?? {},
    };
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

const inputShape = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputShape;

export function registerRouter(server: McpServer): void {
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        const parsed = InputSchema.safeParse(normalizeToolInput(rawArgs));
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for reasoning.router.plan", issues: parsed.error.issues });
        }
        const { task, context, maxSteps } = parsed.data;
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

        const prompt = buildStructuredPrompt({
            mode: "Router planner",
            objective: `Design a ${maxSteps}-step tool plan for the analyst.`,
            inputs: { task, context: context ?? "(none)" },
            steps: [
                "Summarize goal/context internally and decide if socratic clarification is needed first.",
                "Evaluate heuristic signals and choose essential modes within the step cap.",
                "Sequence modes so clarify/creative precede evaluation and risk/verification precede conclusions.",
                "Fill args with minimal structured parameters required per tool.",
                "Ensure razors.apply follows hypothesis/ideation tools and avoid duplicates unless justified.",
            ],
            extras: [
                "Mode quick reference (tool → cue):",
                modeReference,
                "Heuristic signals detected:",
                heuristicsBlock,
                "Planning rules:",
                `- Limit the plan to ${maxSteps} steps.\n- Start with socratic.inquire unless scope is already clear.\n- Follow abductive/divergent with razors.apply.\n- Add redblue.challenge before final answers when risk appears.\n- Provide short \"why\" rationales and JSON args (use {} when empty).\n- Use notes for one-line limitations or follow-ups.`,
            ],
            schema: '{"steps":[{"mode":"","tool":"","why":"","args":{}}],"notes":""}',
        });

        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 420,
            schema: PlanSchema,
            fallback: () => buildHeuristicPlan(task, context, maxSteps),
        });

        return textResult(text);
    };

    server.registerTool(
        "reasoning.router.plan",
        {
            title: "Plan reasoning approach",
            description:
                "Given a task, propose an ordered plan of reasoning modes with brief rationale. Modes include dialectic, socratic, abductive, systems, redblue, analogical, constraint, razors.apply, scientific, self_explain, divergent, exec.",
            inputSchema: inputShape,
        },
        handler
    );
    // Back-compat alias for environments that auto-map dots to underscores
    server.registerTool(
        "reasoning_router_plan",
        {
            title: "Plan reasoning approach",
            description:
                "Alias for reasoning.router.plan (back-compat).",
            inputSchema: inputShape,
        },
        handler
    );
}

function detectSignals(task: string, context: string | undefined): RouterSignals {
    const normalized = `${task} ${context ?? ""}`.toLowerCase();
    const contains = (pattern: RegExp) => pattern.test(normalized);
    const numericConstraintCue = /\b\d+(?:\.\d+)?\s*(?:%|percent|hours?|days?|weeks?|months?|years?|usd|dollars?|€|eur|£|gbp|ms|s|seconds?|minutes?|reqs?|requests?|rpm|rps|users?|people|teams?|headcount|units?|items?|tickets?|capacity)\b/.test(normalized);
    const quantitativeCue = /\b(optimi[sz]|balanc|allocat|schedule|plan|forecast|budget|limit|maximi|minimi|capacity|throughput|latency|utiliz|sla|target|goal|quota|load)\b/.test(normalized);
    const versionReference = /\bversion\s*\d+(?:\.\d+)?\b/.test(normalized);

    return {
        needsHypotheses: contains(/diagnos|root cause|why|uncertain|hypothesis|investigat|anomal/),
        needsCreative: contains(/brainstorm|idea|innov|option|alternativ|explore/),
        needsSystems: contains(/system|feedback|loop|dynamics|ecosystem|supply|demand|stock|flow/),
        needsConstraint:
            contains(/constraint|optimi[sz]e|allocate|schedule|budget|limit|maximize|minimize|>=|<=|tradeoff curve|capacity/) ||
            (!versionReference && numericConstraintCue && quantitativeCue),
        needsRisk: contains(/risk|safety|security|privacy|abuse|attack|hazard|failure|compliance|bias/),
        contested: contains(/trade-?off|controvers|policy|ethic|disagree|stakeholder|debate/),
        wantsAnalogy: contains(/analogy|analog|similar to|compare|precedent|case study/),
        needsScientific: contains(/experiment|test|measurement|data|evidence|validate/),
        wantsSelfExplain: contains(/explain|rationale|justify|transparent|walkthrough/),
        codeOrCalc: contains(/code|script|function|regex|compute|calculate|algorithm|typescript|javascript|json/),
        deepScope: contains(/complex|strategy|roadmap/),
    };
}

function summarizeSignals(signals: RouterSignals): string[] {
    return (Object.entries(signals) as [keyof RouterSignals, boolean][])
        .filter(([, active]) => active)
        .map(([key]) => SIGNAL_DESCRIPTIONS[key]);
}

export const __routerTestUtils = {
    determineMode,
};

function buildHeuristicPlan(task: string, context: string | undefined, maxSteps: number): RouterPlan {
    const signals = detectSignals(task, context);
    const steps: RouterStep[] = [];
    const notes: string[] = [];
    const omissions: string[] = [];

    const push = (step: RouterStep, note?: string): boolean => {
        if (steps.length >= maxSteps) {
            if (note) {
                omissions.push(`${note} (omitted due to ${maxSteps}-step cap).`);
            }
            return false;
        }
        steps.push(step);
        if (note) {
            notes.push(note);
        }
        return true;
    };

    const ensureRazorPlacement = () => {
        const generatorIndex = steps.findIndex((step) => step.mode === "abductive" || step.mode === "divergent");
        if (generatorIndex === -1) {
            return;
        }

        const existingIndex = steps.findIndex((step) => step.mode === "razors.apply");
        const razorStep: RouterStep = {
            mode: "razors.apply",
            tool: "razors.apply",
            why: "Prune or revise options using MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, and Popper tests",
            args: { razors: [...DEFAULT_RAZORS] },
        };

        const insertIndex = Math.min(generatorIndex + 1, steps.length);

        if (existingIndex !== -1) {
            if (existingIndex === insertIndex) {
                return;
            }
            const [existing] = steps.splice(existingIndex, 1);
            steps.splice(Math.min(insertIndex, steps.length), 0, existing);
            return;
        }

        if (steps.length < maxSteps) {
            steps.splice(insertIndex, 0, razorStep);
            return;
        }

        // At capacity: drop the least critical non-generator step to make room
        let removableIndex = -1;
        for (let i = steps.length - 1; i >= 0; i--) {
            const candidateMode = steps[i].mode;
            if (candidateMode !== "socratic" && candidateMode !== "abductive" && candidateMode !== "divergent") {
                removableIndex = i;
                break;
            }
        }

        if (removableIndex === -1) {
            return;
        }

        steps.splice(removableIndex, 1);
        steps.splice(Math.min(insertIndex, steps.length), 0, razorStep);
    };

    push({
        mode: "socratic",
        tool: "socratic.inquire",
        why: "Clarify scope, success criteria, and hidden assumptions",
        args: { topic: task, depth: signals.deepScope ? 3 : 2 },
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
            args: { observations: task, k: signals.needsCreative ? 5 : 4, apply_razors: [...DEFAULT_RAZORS] },
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
            args: { source_domain: "general problem-solving", target_problem: task },
        });
    }

    if (signals.needsConstraint) {
        push({
            mode: "constraint",
            tool: "constraint.solve",
            why: "Check feasibility against formal constraints or optimisation goals",
            args: { model_json: JSON.stringify({ variables: [], constraints: [`task: "${task}"`] }) },
        });
    }

    if (signals.needsRisk) {
        const omissionMessage = "Scheduled redblue.challenge for risk review";
        const riskStep: RouterStep = {
            mode: "redblue",
            tool: "redblue.challenge",
            why: "Stress-test for failure modes and mitigations before deployment",
            args: { proposal: task, rounds: Math.min(3, Math.max(1, maxSteps - steps.length || 1)), focus: ["safety", "security", "bias"] },
        };

        let inserted = push(riskStep, omissionMessage);
        if (!inserted) {
            const droppableModes = new Set<RouterStep["mode"]>([
                "scientific",
                "analogical",
                "exec",
                "self_explain",
                "divergent",
            ]);
            const replaceEntry = steps
                .map((step, idx) => ({ step, idx }))
                .reverse()
                .find(({ step }) => droppableModes.has(step.mode));

            if (replaceEntry) {
                const { step, idx } = replaceEntry;
                steps.splice(idx, 1, riskStep);
                notes.push(`Replaced ${step.mode} with redblue.challenge to honor risk signal.`);
                const omissionIndex = omissions.indexOf(`${omissionMessage} (omitted due to ${maxSteps}-step cap).`);
                if (omissionIndex !== -1) {
                    omissions.splice(omissionIndex, 1);
                }
                inserted = true;
            }
        }

        if (!inserted) {
            omissions.push("Risk review flagged but redblue.challenge could not be scheduled; queue it manually.");
        }
    }

    if (signals.needsScientific) {
        push({
            mode: "scientific",
            tool: "reasoning.scientific",
            why: "Design falsifiable tests and evidence checks",
            args: { goal: task, allow_tools: true },
        });
        if (!steps.some((step) => step.mode === "scientific")) {
            notes.push("Experiment signal detected but reasoning.scientific was skipped due to step limit.");
        }
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
            args: { query: task, allow_citations: true },
        });
    }

    if (signals.contested) {
        push({
            mode: "dialectic",
            tool: "dialectic.tas",
            why: "Surface thesis/antithesis and synthesize trade-offs",
            args: { claim: task, audience: "general" },
        });
    }

    ensureRazorPlacement();

    if (!steps.some((step) => step.mode === "dialectic") && signals.contested && steps.length < maxSteps) {
        push({
            mode: "dialectic",
            tool: "dialectic.tas",
            why: "Synthesize trade-offs before final decision",
            args: { claim: task, audience: "general" },
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
        ] as any, [...DEFAULT_RAZORS]);

        const nextId = selector.primary_mode.id as RouterStep["mode"]; // prefer the selector suggestion
        if (nextId && nextId !== "socratic") {
            const toolMap: Record<string, string> = {
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
            } as const;

            push({
                mode: nextId,
                tool: toolMap[nextId] ?? undefined,
                why: selector.primary_mode.reason ?? "Selector heuristic recommendation",
                args: {},
            });
        } else {
            push({
                mode: "scientific",
                tool: "reasoning.scientific",
                why: "Structure the next investigative steps when no other heuristic fired",
                args: { goal: task, allow_tools: true },
            });
        }
    }

    const triggered = summarizeSignals(signals);
    const summaryNote =
        triggered.length > 0
            ? `Heuristic fallback triggered: ${triggered.join("; ")}.`
            : "Heuristic fallback generated from keyword analysis; rerun with sampling for nuance.";

    const allNotes = [summaryNote, ...notes, ...omissions];

    return {
        steps,
        notes: allNotes.filter(Boolean).join(" "),
    };
}
