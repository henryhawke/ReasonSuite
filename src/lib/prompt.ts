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

export const STRICT_JSON_COMPACT =
    "Output MUST be strict JSON that matches the schema. Double quotes for every key/string. No fences or commentary.";

type PromptBuilderOptions = {
    mode: string;
    objective: string;
    inputs: Record<string, string | undefined | null>;
    steps: string[];
    schema: string;
    extras?: string[];
    reminders?: string[];
    maxInputLength?: number;
};

function formatValue(value: string | undefined | null, limit: number): string | null {
    if (!value) {
        return null;
    }
    const normalized = value.replace(/[\s\n\r\t]+/g, " ").trim();
    if (!normalized) {
        return null;
    }
    if (normalized.length <= limit) {
        return normalized;
    }
    return `${normalized.slice(0, Math.max(0, limit - 1))}…`;
}

export function buildStructuredPrompt({
    mode,
    objective,
    inputs,
    steps,
    schema,
    extras = [],
    reminders = [STRICT_JSON_COMPACT],
    maxInputLength = 600,
}: PromptBuilderOptions): string {
    const sections: string[] = [];
    sections.push(`${mode} mode.`);
    sections.push(`Goal: ${objective}.`);

    const formattedInputs = Object.entries(inputs)
        .map(([key, value]) => {
            const formatted = formatValue(value, maxInputLength);
            return formatted ? `${key}: ${formatted}` : null;
        })
        .filter((entry): entry is string => typeof entry === "string");
    if (formattedInputs.length) {
        sections.push(`Inputs → ${formattedInputs.join(" | ")}`);
    }

    if (steps.length) {
        const joinedSteps = steps.map((step, idx) => `${idx + 1}. ${step}`).join(" ");
        sections.push(`Do → ${joinedSteps}`);
    }

    if (extras.length) {
        sections.push(...extras.map((extra) => extra.trim()).filter(Boolean));
    }

    if (reminders.length) {
        sections.push(...reminders.map((reminder) => reminder.trim()).filter(Boolean));
    }

    sections.push(`Schema → ${schema}`);

    return sections.filter(Boolean).join("\n");
}
