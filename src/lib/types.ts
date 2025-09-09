export type ReasoningMode =
    | "dialectic"
    | "socratic"
    | "abductive"
    | "systems"
    | "redblue"
    | "analogical"
    | "constraint"
    | "razors.apply";

export type RouterStep = {
    mode: ReasoningMode;
    why: string;
    args?: Record<string, unknown>;
};

export type RouterPlan = {
    steps: RouterStep[];
    notes?: string;
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
};

export type SocraticTree = {
    layers: { level: number; questions: string[] }[];
    assumptions_to_test: string[];
    evidence_to_collect: string[];
    next_actions: string[];
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
};

export type SystemsMap = {
    mermaid: string;
    loops: { type: "reinforcing" | "balancing"; nodes: string[] }[];
    leverage_points: string[];
    stock_flow_hints: { stock: string; inflows: string[]; outflows: string[] }[];
    assumptions: string[];
    risks: string[];
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
};

export type AnalogicalResult = {
    mapping: { source: string; target: string; justification: string }[];
    shared_relations: string[];
    mismatches: string[];
    transferable_insights: string[];
    failure_modes: string[];
};


