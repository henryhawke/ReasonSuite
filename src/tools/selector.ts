import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DEFAULT_RAZORS, RAZOR_DESCRIPTIONS } from "../lib/razors.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
import type { ReasoningMode } from "../lib/types.js";

const MODE_IDS = [
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
] as const satisfies readonly ReasoningMode[];

type ModeId = (typeof MODE_IDS)[number];

type ModeProfile = {
    label: string;
    summary: string;
    cues: string[];
    signals: RegExp[];
    base: number;
};

const MODE_CATALOG: Record<ModeId, ModeProfile> = {
    socratic: {
        label: "Socratic Inquiry",
        summary: "Clarify scope, surface assumptions, and define success criteria before committing to a path.",
        cues: ["Ambiguous scope", "Multiple stakeholders", "Missing success definition"],
        signals: [/clarif/i, /scope/i, /assumption/i, /unknown/i],
        base: 0.45,
    },
    abductive: {
        label: "Abductive Hypothesis Ranking",
        summary: "Generate and score competing explanations when evidence is incomplete or ambiguous.",
        cues: ["Diagnosis", "Root cause", "Why did this happen"],
        signals: [/diagnos/i, /root cause/i, /why/i, /hypoth/i, /anomal/i, /myster/i],
        base: 0.25,
    },
    "razors.apply": {
        label: "Razor Screening",
        summary: "Apply Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, and Popper tests to prune weak options.",
        cues: ["Need to prune options", "Screen speculative claims", "Check plausibility"],
        signals: [/razor/i, /occam/i, /plausib/i, /speculat/i, /option/i, /hypoth/i, /choose/i],
        base: 0.2,
    },
    systems: {
        label: "Systems Mapping",
        summary: "Map feedback loops, stocks/flows, and leverage points across interacting factors.",
        cues: ["Ecosystems", "Dynamics", "Feedback loops"],
        signals: [/system/i, /feedback/i, /loop/i, /dynamic/i, /ecosystem/i, /interdepend/i, /supply/i, /demand/i],
        base: 0.2,
    },
    analogical: {
        label: "Analogical Mapping",
        summary: "Transfer structure from an analogous case while flagging mismatches and limits.",
        cues: ["Compare domains", "Look for precedent", "Use analogy"],
        signals: [/analog/i, /similar/i, /compare/i, /precedent/i, /case study/i, /metaphor/i],
        base: 0.15,
    },
    constraint: {
        label: "Constraint Solver",
        summary: "Encode limits/optimization goals as constraints, test feasibility, or optimize outcomes.",
        cues: ["Optimization", "Scheduling", "Budget/limits"],
        signals: [/constraint/i, /optimi[sz]/i, /schedule/i, /budget/i, /allocat/i, /limit/i, />=/, /<=/, /maximize/i, /minimi/i, /\b\d+\b/],
        base: 0.18,
    },
    redblue: {
        label: "Red/Blue Challenge",
        summary: "Stress-test for failure modes, attacks, safety hazards, and mitigations.",
        cues: ["Safety review", "Risk assessment", "Adversarial thinking"],
        signals: [/risk/i, /safety/i, /attack/i, /threat/i, /abuse/i, /hazard/i, /failure/i, /compliance/i, /bias/i, /security/i],
        base: 0.22,
    },
    dialectic: {
        label: "Dialectic TAS",
        summary: "Lay out thesis, antithesis, and synthesis for contested, multi-perspective issues.",
        cues: ["Debates", "Trade-offs", "Policy tension"],
        signals: [/debate/i, /controvers/i, /trade-?off/i, /stakeholder/i, /disagree/i, /policy/i, /ethic/i],
        base: 0.18,
    },
    scientific: {
        label: "Scientific Method",
        summary: "Design falsifiable experiments, define evidence needs, and plan validation steps.",
        cues: ["Experiments", "Data validation", "Measurement"],
        signals: [/experiment/i, /test/i, /measurement/i, /data/i, /evidence/i, /validate/i, /metric/i],
        base: 0.2,
    },
    self_explain: {
        label: "Self-Explanation",
        summary: "Produce transparent rationales, intermediate steps, and self-critique.",
        cues: ["Explain reasoning", "Trace logic", "Audit trail"],
        signals: [/explain/i, /rationale/i, /justify/i, /walkthrough/i, /transparent/i, /trace/i],
        base: 0.16,
    },
    divergent: {
        label: "Divergent → Convergent",
        summary: "Expand the option space then evaluate with explicit criteria before choosing a winner.",
        cues: ["Brainstorm", "Generate options", "Ideation"],
        signals: [/brainstorm/i, /idea/i, /innov/i, /option/i, /alternativ/i, /explore/i, /creative/i],
        base: 0.2,
    },
    exec: {
        label: "Execution Sandbox",
        summary: "Run quick code or calculations in a sandbox to prototype or verify results.",
        cues: ["Code", "Scripts", "Computation"],
        signals: [/code/i, /script/i, /function/i, /regex/i, /compute/i, /calculate/i, /algorithm/i, /typescript/i, /javascript/i, /json/i],
        base: 0.1,
    },
};

const MODE_SET = new Set<ModeId>(MODE_IDS);

const RAZOR_HINTS: Record<
    string,
    {
        label: string;
        cues: string;
        signals: RegExp[];
    }
> = {
    MDL: {
        label: "Minimum Description Length",
        cues: "Complex explanations, many moving parts, overfit stories",
        signals: [/complex/i, /overly/i, /complicated/i, /many assumptions/i, /sprawl/i],
    },
    BayesianOccam: {
        label: "Bayesian Occam",
        cues: "Scarce evidence, need to balance priors vs likelihood",
        signals: [/probab/i, /likelihood/i, /bayes/i, /prior/i, /belief/i, /uncertain/i],
    },
    Sagan: {
        label: "Sagan Standard",
        cues: "Extraordinary or dramatic claims lacking proportionate proof",
        signals: [/extraordinary/i, /incredible/i, /unprecedented/i, /miracle/i, /massive/i, /sweeping/i],
    },
    Hitchens: {
        label: "Hitchens' Razor",
        cues: "Assertions without evidence or cited support",
        signals: [/claim/i, /assert/i, /rumor/i, /unsubstanti/i, /without evidence/i, /no proof/i],
    },
    Hanlon: {
        label: "Hanlon's Razor",
        cues: "Attributing harm to malice when incompetence or noise suffice",
        signals: [/malice/i, /evil/i, /malicious/i, /nefarious/i, /intentional harm/i, /sabotage/i],
    },
    Popper: {
        label: "Popper Falsifiability",
        cues: "Hypotheses, theories, or policies needing falsification tests",
        signals: [/falsif/i, /test/i, /experiment/i, /hypoth/i, /theory/i, /predict/i, /refut/i],
    },
};

const InputSchema = z.object({
    request: z.string().describe("Original user prompt or task"),
    context: z.string().optional(),
    candidate_modes: z.array(z.string()).default([...MODE_IDS]),
    candidate_razors: z.array(z.string()).default([...DEFAULT_RAZORS]),
});

// Use the full Zod schema for MCP tool input validation
const inputSchema = InputSchema as any;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

type ModeScore = {
    id: ModeId;
    label: string;
    score: number;
    reason: string;
};

type RazorScore = {
    id: string;
    label: string;
    score: number;
    reason: string;
};

const OutputSchema = z
    .object({
        primary_mode: z.object({
            id: z.string(),
            label: z.string(),
            confidence: z.number().min(0).max(1),
            reason: z.string(),
        }),
        supporting_modes: z
            .array(
                z.object({
                    id: z.string(),
                    label: z.string(),
                    score: z.number().min(0).max(1),
                    reason: z.string(),
                })
            )
            .default([]),
        razor_stack: z
            .array(
                z.object({
                    id: z.string(),
                    label: z.string(),
                    score: z.number().min(0).max(1),
                    reason: z.string(),
                })
            )
            .default([]),
        decision_path: z
            .array(
                z.object({
                    observation: z.string(),
                    implication: z.string(),
                })
            )
            .default([]),
        next_action: z.string().optional(),
        notes: z.string().optional(),
    })
    .extend({ meta: ReasoningMetadataSchema.optional() });

function isModeId(value: string): value is ModeId {
    return MODE_SET.has(value as ModeId);
}

function renderModeCatalog(modeIds: ModeId[]): string {
    return modeIds
        .map((id) => {
            const info = MODE_CATALOG[id];
            if (!info) {
                return `- ${id}: General reasoning mode.`;
            }
            return `- ${id} (${info.label}): ${info.summary} Signals: ${info.cues.join(", ")}`;
        })
        .join("\n");
}

function renderRazorCatalog(razorIds: string[]): string {
    return razorIds
        .map((id) => {
            const description = RAZOR_DESCRIPTIONS[id] ?? "No stored description.";
            const hint = RAZOR_HINTS[id];
            if (!hint) {
                return `- ${id}: ${description}`;
            }
            return `- ${id}: ${description} Signals: ${hint.cues}`;
        })
        .join("\n");
}

function clampScore(value: number): number {
    return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export function buildFallback(
    request: string,
    context: string | undefined,
    modes: ModeId[],
    razors: string[]
) {
    const text = `${request} ${context ?? ""}`.toLowerCase();
    const available = new Set<ModeId>(modes);
    const scores = new Map<ModeId, number>();
    const reasons = new Map<ModeId, Set<string>>();
    const decisionPath: { observation: string; implication: string }[] = [];

    const addReason = (id: ModeId, reason: string, delta: number) => {
        if (!available.has(id)) return;
        scores.set(id, (scores.get(id) ?? MODE_CATALOG[id]?.base ?? 0.1) + delta);
        const store = reasons.get(id) ?? new Set<string>();
        store.add(reason);
        reasons.set(id, store);
    };

    const note = (observation: string, implication: string) => {
        decisionPath.push({ observation, implication });
    };

    // Baseline for Socratic if available
    if (available.has("socratic")) {
        scores.set("socratic", MODE_CATALOG.socratic.base);
        reasons.set("socratic", new Set(["Default clarifying step for ambiguous prompts."]));
    }

    const detect = (pattern: RegExp, onHit: () => void, observation: string, implication: string) => {
        if (pattern.test(text)) {
            note(observation, implication);
            onHit();
            return true;
        }
        return false;
    };

    const creative = detect(
        /brainstorm|idea|innov|option|alternativ|explore|creative|greenfield/,
        () => {
            addReason("divergent", "Creative/ideation language detected", 0.45);
            addReason("razors.apply", "Need to prune after ideation", 0.25);
        },
        "Detected creative ideation cues (brainstorm/idea/etc.)",
        "Favors divergent exploration followed by razor pruning"
    );

    const hypotheses = detect(
        /diagnos|root cause|why|hypothes|investigat|anomal|myster|interpret/,
        () => {
            addReason("abductive", "Diagnosis/root-cause language", 0.4);
            addReason("razors.apply", "Hypotheses benefit from razor screening", 0.22);
        },
        "Found diagnosis/root-cause cues",
        "Points to abductive hypothesis ranking and razor screening"
    );

    detect(
        /system|feedback|loop|dynamic|ecosystem|interdepend|supply|demand|network|ripple/,
        () => addReason("systems", "Systems/dynamics vocabulary", 0.42),
        "Systems or dynamics terminology present",
        "Map causal loops and leverage points"
    );

    const constraint = detect(
        /constraint|optimi[sz]|schedule|budget|allocat|limit|maximi|minimi|>=|<=|\b\d+\b|tradeoff curve|capacity/,
        () => addReason("constraint", "Optimization/constraint cues", 0.48),
        "Optimization or numeric constraints noted",
        "Prefer constraint solving to test feasibility"
    );

    const risk = detect(
        /risk|safety|attack|threat|abuse|hazard|failure|compliance|bias|exploit|breach/,
        () => addReason("redblue", "Risk/threat keywords", 0.46),
        "Risk or adversarial words detected",
        "Red/blue challenge to stress-test mitigations"
    );

    detect(
        /debate|controvers|trade-?off|stakeholder|disagree|policy|ethic|tension/,
        () => addReason("dialectic", "Contested/dual-view framing", 0.38),
        "Contested or policy language present",
        "Dialectic TAS to surface trade-offs"
    );

    detect(
        /analog|similar|compare|precedent|case study|metaphor|analogy/,
        () => addReason("analogical", "Analogy/comparison keywords", 0.4),
        "Analogy or comparison cues",
        "Analogical mapping to transfer structure and flag mismatches"
    );

    detect(
        /experiment|test|measurement|metric|data|evidence|validate|trial|prototype/,
        () => addReason("scientific", "Experiment/test language", 0.42),
        "Experimentation or evidence gathering requested",
        "Scientific decomposition to plan falsifiable tests"
    );

    const explain = detect(
        /explain|justify|rationale|walkthrough|transparent|audit|trace/,
        () => addReason("self_explain", "Transparency/explanation cues", 0.38),
        "Transparency or explanation requested",
        "Self-explanation to make reasoning explicit"
    );

    const code = detect(
        /code|script|function|regex|compute|calculate|algorithm|typescript|javascript|python|json|simulate|prototype/,
        () => addReason("exec", "Coding/calculation keywords", 0.5),
        "Code or computation keywords present",
        "Execution sandbox to quickly verify computations"
    );

    const razorExplicit = detect(
        /razor|occam|popper|hanlon|hitchens|sagan|bayesian occam/,
        () => addReason("razors.apply", "Explicit razor reference", 0.55),
        "Explicit request for razors",
        "Use razor screening as the primary move"
    );

    if (!razorExplicit && !creative && !hypotheses) {
        // Keep razor as supporting option if available
        addReason("razors.apply", "General plausibility pruning", 0.1);
    }

    // If no signals besides baseline, ensure Socratic remains viable
    if (decisionPath.length === 0 && available.has("socratic")) {
        note("No strong heuristic signals detected", "Default to Socratic questioning to clarify scope");
    }

    const modeScores: ModeScore[] = modes.map((mode) => {
        const profile = MODE_CATALOG[mode];
        const score = clampScore(scores.get(mode) ?? profile?.base ?? 0.1);
        const reasonSet = reasons.get(mode);
        const reason = reasonSet && reasonSet.size > 0 ? Array.from(reasonSet).join("; ") : profile?.summary ?? "General utility.";
        return {
            id: mode,
            label: profile?.label ?? mode,
            score,
            reason,
        };
    });

    modeScores.sort((a, b) => b.score - a.score);
    const primary = modeScores[0] ?? {
        id: modes[0]!,
        label: MODE_CATALOG[modes[0] as ModeId]?.label ?? modes[0]!,
        score: clampScore(MODE_CATALOG[modes[0] as ModeId]?.base ?? 0.4),
        reason: MODE_CATALOG[modes[0] as ModeId]?.summary ?? "Default primary mode.",
    };

    const supporting = modeScores.slice(1, 4).filter((entry) => entry.score >= 0.15);

    const razorScores = rankRazorsFallback({
        request,
        context,
        razors,
        creative,
        hypotheses,
        risk,
        explain,
        code,
        constraint,
    });

    const nextAction = supporting.length
        ? `Lead with ${primary.label} then consider ${supporting[0]!.label}${razorScores.length ? ` and apply ${razorScores
            .map((r) => r.label)
            .slice(0, 2)
            .join("/")} razors` : ""}.`
        : razorScores.length
            ? `Lead with ${primary.label} and stack ${razorScores.map((r) => r.label).slice(0, 2).join("/")} razors.`
            : `Lead with ${primary.label}.`;

    return {
        primary_mode: {
            id: primary.id,
            label: primary.label,
            confidence: clampScore(primary.score),
            reason: primary.reason,
        },
        supporting_modes: supporting.map((entry) => ({
            id: entry.id,
            label: entry.label,
            score: clampScore(entry.score),
            reason: entry.reason,
        })),
        razor_stack: razorScores,
        decision_path: decisionPath.slice(0, 4),
        next_action: nextAction,
        notes: "Deterministic heuristic fallback. Re-run with model sampling for richer rationale.",
    };
}

export function rankRazorsFallback(opts: {
    request: string;
    context: string | undefined;
    razors: string[];
    creative: boolean;
    hypotheses: boolean;
    risk: boolean;
    explain: boolean;
    code: boolean;
    constraint: boolean;
}): RazorScore[] {
    const { request, context, razors, creative, hypotheses, risk, explain, code, constraint } = opts;
    const text = `${request} ${context ?? ""}`.toLowerCase();
    const results: RazorScore[] = [];

    for (const id of razors) {
        const base = 0.12;
        let score = base;
        const hint = RAZOR_HINTS[id];
        const description = RAZOR_DESCRIPTIONS[id] ?? hint?.label ?? `${id} razor`;
        const label = hint?.label ?? `${id} Razor`;
        const matches = hint?.signals?.filter((regex) => regex.test(text)) ?? [];
        const reasons: string[] = [];

        if (matches.length) {
            score += matches.length * 0.18;
            reasons.push(`Triggered by cues matching ${matches.map((m) => `/${m.source}/`).join(", ")}`);
        }

        if (hypotheses && (id === "MDL" || id === "BayesianOccam" || id === "Popper")) {
            score += 0.22;
            reasons.push("Hypothesis-oriented request benefits from parsimony and falsifiability checks");
        }

        if (creative && (id === "MDL" || id === "BayesianOccam" || id === "Sagan")) {
            score += 0.18;
            reasons.push("Divergent ideation needs trimming with simplicity/evidence tests");
        }

        if (risk && (id === "Sagan" || id === "Hitchens" || id === "Hanlon")) {
            score += 0.15;
            reasons.push("Risk/safety context favors evidence and intent discrimination razors");
        }

        if (constraint && id === "MDL") {
            score += 0.12;
            reasons.push("Constraint/optimization framing rewards minimal models");
        }

        if (explain && id === "Hitchens") {
            score += 0.1;
            reasons.push("Transparency demand highlights unsupported assertions");
        }

        if (code && id === "Popper") {
            score += 0.08;
            reasons.push("Executable experiments enable falsifiability checks");
        }

        if (score <= base + 0.01) {
            reasons.push(description);
        }

        results.push({
            id,
            label,
            score: clampScore(score),
            reason: Array.from(new Set(reasons)).join("; "),
        });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 4);
}

export function registerSelector(server: McpServer): void {
    const handler = async ({ request, context, candidate_modes, candidate_razors }: any) => {
        const modes = (candidate_modes?.length ? candidate_modes : [...MODE_IDS]).filter(isModeId);
        const normalizedModes = modes.length ? modes : [...MODE_IDS];
        const razorList = candidate_razors?.length ? candidate_razors : [...DEFAULT_RAZORS];

        const prompt = `You are the ReasonSuite meta-selector. Analyze the user's request and recommend the single best reasoning mode to run next plus the razors to stack afterwards. Work through the cues explicitly and keep the output JSON strict.\n\nRequest: ${request}\nContext: ${context ?? "(none)"}\n\nCandidate thinking modes:\n${renderModeCatalog(normalizedModes)}\n\nCandidate razors:\n${renderRazorCatalog(razorList)}\n\nDeliberation instructions:\n1. Extract the salient signals or keywords from the request/context.\n2. Score each candidate mode between 0 and 1 using those signals.\n3. Pick the highest-utility primary_mode (prefer modes over razors unless the request explicitly centers razors).\n4. List up to three supporting modes with short justifications.\n5. Recommend up to four razors in the order they should be applied, or none if irrelevant.\n6. Document your reasoning steps as observation/implication pairs in decision_path.\n\nReturn strict JSON only:\n{\n  "primary_mode": {"id":"mode id","label":"human label","confidence":0.0-1.0,"reason":"summary"},\n  "supporting_modes": [{"id":"...","label":"...","score":0.0-1.0,"reason":"..."}],\n  "razor_stack": [{"id":"...","label":"...","score":0.0-1.0,"reason":"..."}],\n  "decision_path": [{"observation":"...","implication":"..."}],\n  "next_action": "optional guidance",\n  "notes": "optional caveats"\n}`;

        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 750,
            schema: OutputSchema,
            fallback: () => buildFallback(request, context, normalizedModes, razorList),
        });

        return { content: [{ type: "text", text }] };
    };

    const config = {
        title: "Select reasoning mode & razors",
        description:
            "Given a request, recommend the most useful reasoning mode and which Occam/Popper-style razors to apply next.",
        inputSchema,
    } as const;

    const wrap = (h: any) => (args: any, _extra: any) => h(args);
    server.registerTool("reasoning.selector", config as any, wrap(handler));
    // Provide underscore and dashed aliases for clients that use snake_case/kebab_case naming
    server.registerTool("reasoning_selector", config as any, wrap(handler));
    server.registerTool("reasoning-selector", config as any, wrap(handler));
}
