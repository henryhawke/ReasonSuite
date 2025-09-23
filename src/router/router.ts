import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ZodRawShape } from "zod";
import { DEFAULT_RAZORS } from "../lib/razors.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
import { buildFallback as selectorFallback } from "../tools/selector.js";
import type { RouterPlan, RouterStep } from "../lib/types.js";

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

const inputShape = InputSchema.shape as ZodRawShape;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputShape;

export function registerRouter(server: McpServer): void {
    const handler: ToolCallback<InputShape> = async ({ task, context, maxSteps }) => {
        const prompt = `You are a planning assistant that selects reasoning tools for an autonomous analyst.
Available modes and their corresponding tool IDs:
- socratic -> socratic.inquire (scope + assumptions)
- abductive -> abductive.hypothesize (generate hypotheses)
- razors.apply -> razors.apply (Occam/Hitchens/Popper screening)
- systems -> systems.map (causal loop diagram)
- analogical -> analogical.map (transfer structure)
- constraint -> constraint.solve (formulate/solve constraints)
- redblue -> redblue.challenge (adversarial review)
- dialectic -> dialectic.tas (thesis/antithesis/synthesis)
- scientific -> reasoning.scientific (decompose + tests)
- self_explain -> reasoning.self_explain (transparent rationale)
- divergent -> reasoning.divergent_convergent (brainstorm then converge)
- exec -> exec.run (sandboxed JS experiments)
Task: ${task}
Context: ${context ?? ""}

Return strict JSON only:
{
  "steps": [
    {"mode":"...","tool":"tool.id","why":"...","args":{}}
  ],
  "notes": "one-line on expected limitations"
}
Limit steps to ${maxSteps}. Always start by clarifying scope (socratic) unless the task is already extremely specific. Prefer constraint when explicit numeric/logical limits or optimisation keywords appear. Prefer systems when many interacting variables, feedback, or dynamics are mentioned. Prefer abductive for incomplete evidence or diagnosis tasks and schedule razors.apply immediately after any generative hypothesis/idea step. Use redblue for safety, risk, or deployment checks before final answers. Use analogical when a source domain is provided or comparative reasoning is requested. Invoke scientific when experiments/tests/data validation are required. Include tool IDs in the plan.`;

        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 600,
            schema: PlanSchema,
            fallback: () => buildHeuristicPlan(task, context, maxSteps),
        });

        return { content: [{ type: "text", text }] };
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
}

function buildHeuristicPlan(task: string, context: string | undefined, maxSteps: number): RouterPlan {
    const normalized = `${task} ${context ?? ""}`.toLowerCase();
    const steps: RouterStep[] = [];

    const push = (step: RouterStep) => {
        if (steps.length >= maxSteps) return;
        steps.push(step);
    };

    const contains = (pattern: RegExp) => pattern.test(normalized);

    push({
        mode: "socratic",
        tool: "socratic.inquire",
        why: "Clarify scope, success criteria, and hidden assumptions",
        args: { depth: contains(/complex|strategy|roadmap/) ? 3 : 2 },
    });

    const needsHypotheses = contains(/diagnos|root cause|why|uncertain|hypothesis|investigat|anomal/);
    const needsCreative = contains(/brainstorm|idea|innov|option|alternativ|explore/);
    const needsSystems = contains(/system|feedback|loop|dynamics|ecosystem|supply|demand|stock|flow/);
    const needsConstraint = contains(/constraint|optimi[sz]e|allocate|schedule|budget|limit|maximize|minimize|>=|<=|\b\d+/);
    const needsRisk = contains(/risk|safety|security|privacy|abuse|attack|hazard|failure|compliance|bias/);
    const contested = contains(/trade-?off|controvers|policy|ethic|disagree|stakeholder|debate/);
    const wantsAnalogy = contains(/analogy|analog|similar to|compare|precedent|case study/);
    const needsScientific = contains(/experiment|test|measurement|data|evidence|validate/);
    const wantsSelfExplain = contains(/explain|rationale|justify|transparent|walkthrough/);
    const codeOrCalc = contains(/code|script|function|regex|compute|calculate|algorithm|typescript|javascript|json/);

    if (needsCreative) {
        push({
            mode: "divergent",
            tool: "reasoning.divergent_convergent",
            why: "Expand the option space before converging with explicit criteria",
            args: { prompt: task, k: Math.min(5, Math.max(3, maxSteps)) },
        });
    }

    if (needsHypotheses) {
        push({
            mode: "abductive",
            tool: "abductive.hypothesize",
            why: "Generate and score candidate explanations",
            args: { k: needsCreative ? 5 : 4, apply_razors: [...DEFAULT_RAZORS] },
        });
    }

    if (needsSystems) {
        push({
            mode: "systems",
            tool: "systems.map",
            why: "Map feedback loops and leverage points",
            args: { variables: [] },
        });
    }

    if (wantsAnalogy) {
        push({
            mode: "analogical",
            tool: "analogical.map",
            why: "Transfer structure from analogous domains while flagging mismatches",
            args: {},
        });
    }

    if (needsConstraint) {
        push({
            mode: "constraint",
            tool: "constraint.solve",
            why: "Check feasibility against formal constraints or optimisation goals",
            args: { model_json: "" },
        });
    }

    if (needsScientific) {
        push({
            mode: "scientific",
            tool: "reasoning.scientific",
            why: "Design falsifiable tests and evidence checks",
            args: { allow_tools: true },
        });
    }

    if (codeOrCalc) {
        push({
            mode: "exec",
            tool: "exec.run",
            why: "Prototype or verify small computations in a sandbox",
            args: { timeout_ms: 1500 },
        });
    }

    if (wantsSelfExplain) {
        push({
            mode: "self_explain",
            tool: "reasoning.self_explain",
            why: "Produce transparent rationale, citations, and self-critique",
            args: { allow_citations: true },
        });
    }

    if (contested) {
        push({
            mode: "dialectic",
            tool: "dialectic.tas",
            why: "Surface thesis/antithesis and synthesize trade-offs",
            args: { audience: "general" },
        });
    }

    if (needsRisk) {
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

    if (!steps.some((step) => step.mode === "dialectic") && contested && steps.length < maxSteps) {
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
                args: { allow_tools: true },
            });
        }
    }

    return {
        steps,
        notes: "Heuristic fallback generated from keyword analysis; rerun with sampling for nuanced sequencing.",
    };
}
