export type ReasoningMode =
    | "dialectic"
    | "socratic"
    | "abductive"
    | "systems"
    | "redblue"
    | "analogical"
    | "constraint"
    | "razors.apply"
    | "scientific"
    | "self_explain"
    | "divergent"
    | "exec";

export type ReasoningMetadata = {
    source: "model" | "fallback";
    warnings?: string[];
    raw?: string;
};

export type RouterStep = {
    mode: ReasoningMode;
    tool?: string;
    why: string;
    args?: Record<string, unknown>;
};

export type RouterPlan = {
    steps: RouterStep[];
    notes?: string;
    meta?: ReasoningMetadata;
};

export type DialecticResult = {
    thesis: { position: string; key_points: string[] };
    antithesis: { position: string; key_points: string[] };
    synthesis: {
        proposal: string;
        assumptions: string[];
        tradeoffs: string[];
        evidence_needed: string[];
    };
    open_questions: string[];
    meta?: ReasoningMetadata;
};

export type SocraticTree = {
    layers: { level: number; questions: string[] }[];
    assumptions_to_test: string[];
    evidence_to_collect: string[];
    next_actions: string[];
    meta?: ReasoningMetadata;
};

export type AbductiveHypothesis = {
    id: string;
    statement: string;
    rationale: string;
    scores: {
        prior_plausibility: number;
        explanatory_power: number;
        simplicity_penalty: number;
        testability: number;
        overall: number;
    };
};

export type AbductiveResult = {
    hypotheses: AbductiveHypothesis[];
    experiments_or_evidence: string[];
    notes?: string;
    meta?: ReasoningMetadata;
};

export type RazorsDecision = {
    id: string;
    keep_or_drop: "keep" | "drop" | "revise";
    reasons: string[];
    risk_notes?: string;
};

export type RazorsResult = {
    results: RazorsDecision[];
    shortlist: string[];
    notes?: string;
    meta?: ReasoningMetadata;
};

export type SystemsMap = {
    mermaid: string;
    loops: { type: "reinforcing" | "balancing"; nodes: string[] }[];
    leverage_points: string[];
    stock_flow_hints: { stock: string; inflows: string[]; outflows: string[] }[];
    assumptions: string[];
    risks: string[];
    meta?: ReasoningMetadata;
};

export type RedBlueRound = {
    n: number;
    red: { attack: string };
    blue: { defense: string; mitigations: string[] };
};

export type RedBlueResult = {
    rounds: RedBlueRound[];
    defects: { type: string; severity: "low" | "med" | "high"; evidence: string }[];
    risk_matrix: { low: string[]; medium: string[]; high: string[] };
    final_guidance: string[];
    meta?: ReasoningMetadata;
};

export type AnalogicalResult = {
    mapping: { source: string; target: string; justification: string }[];
    shared_relations: string[];
    mismatches: string[];
    transferable_insights: string[];
    failure_modes: string[];
    meta?: ReasoningMetadata;
};

export type ReasoningSelectorResult = {
    primary_mode: { id: string; label: string; confidence: number; reason: string };
    supporting_modes: { id: string; label: string; score: number; reason: string }[];
    razor_stack: { id: string; label: string; score: number; reason: string }[];
    decision_path: { observation: string; implication: string }[];
    next_action?: string;
    notes?: string;
    meta?: ReasoningMetadata;
};
