export type PromptArgsShape = Record<string, unknown>;

export function definePromptArgsShape<T extends PromptArgsShape>(shape: T): T {
    return shape;
}

export const STRICT_JSON_REMINDER = [
    "Deliberation discipline:",
    "- Think through the requested steps internally before you reply.",
    "- Cross-check that each field you populate is consistent with the provided inputs.",
    "",
    "Output rules:",
    "- Respond with STRICT JSON exactly matching the schema that follows.",
    "- Use double quotes for every key and string literal.",
    "- Do not wrap the JSON in Markdown code fences or add commentary before or after it.",
].join("\n");
