export const DEFAULT_RAZORS = ["MDL", "BayesianOccam", "Sagan", "Hitchens", "Hanlon", "Popper"] as const;

export const RAZOR_DESCRIPTIONS: Record<string, string> = {
    MDL: "Favor explanations with the minimal description length / simplest model consistent with the observations.",
    BayesianOccam: "Prefer hypotheses that make sharper predictions with higher posterior odds when evidence is scarce.",
    Sagan: "Extraordinary claims require proportionally extraordinary evidence; downgrade bold claims lacking support.",
    Hitchens: "What can be asserted without evidence can be dismissed without evidence; demand explicit backing for key steps.",
    Hanlon: "Do not attribute to malice what can be explained by neglect, noise, or incompetence.",
    Popper: "Retain hypotheses that are falsifiable with clear tests; discard unfalsifiable stories.",
};

export function summarizeRazors(names: string[]): string {
    if (!names.length) return "None";
    return names
        .map((name) => {
            const desc = RAZOR_DESCRIPTIONS[name] ?? "";
            return desc ? `${name}: ${desc}` : name;
        })
        .join("\n");
}
