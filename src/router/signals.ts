export type RouterSignals = {
    needsHypotheses: boolean;
    needsCreative: boolean;
    needsSystems: boolean;
    needsConstraint: boolean;
    needsRisk: boolean;
    contested: boolean;
    wantsAnalogy: boolean;
    needsScientific: boolean;
    wantsSelfExplain: boolean;
    codeOrCalc: boolean;
    deepScope: boolean;
};

export const SIGNAL_DESCRIPTIONS: Record<keyof RouterSignals, string> = {
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
