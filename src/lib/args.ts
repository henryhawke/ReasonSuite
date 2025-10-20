function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function attemptParseJson(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}

function coerceString(value: unknown): string | undefined {
    if (typeof value === "string") {
        return value;
    }
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (Array.isArray(value)) {
        const joined = value
            .map((entry) => coerceString(entry))
            .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
        if (joined.length) {
            return joined.join("\n");
        }
        return undefined;
    }
    if (isPlainObject(value)) {
        const candidates = ["text", "value", "string", "content", "message", "body"];
        for (const key of candidates) {
            if (key in value) {
                const candidate = coerceString(value[key]);
                if (candidate !== undefined) {
                    return candidate;
                }
            }
        }
    }
    return undefined;
}

function fromKeyValueArray(entries: unknown): Record<string, unknown> | undefined {
    if (!Array.isArray(entries)) {
        return undefined;
    }
    const result: Record<string, unknown> = {};
    for (const entry of entries) {
        if (!isPlainObject(entry)) {
            continue;
        }
        const key =
            typeof entry.name === "string"
                ? entry.name
                : typeof entry.key === "string"
                ? entry.key
                : typeof entry.field === "string"
                ? entry.field
                : undefined;
        if (!key) {
            continue;
        }
        if ("value" in entry) {
            result[key] = entry.value;
        } else if ("text" in entry) {
            result[key] = entry.text;
        } else if ("content" in entry) {
            result[key] = entry.content;
        }
    }
    if (Object.keys(result).length === 0) {
        return undefined;
    }
    return result;
}

function unwrapNested(value: Record<string, unknown>, keys: string[]): Record<string, unknown> | undefined {
    for (const key of keys) {
        if (key in value) {
            const candidate = value[key];
            if (isPlainObject(candidate)) {
                return candidate;
            }
            if (typeof candidate === "string") {
                const parsed = attemptParseJson(candidate.trim());
                if (isPlainObject(parsed)) {
                    return parsed;
                }
            }
        }
    }
    return undefined;
}

export function normalizeToolInput(rawArgs: unknown): Record<string, unknown> {
    if (rawArgs === null || rawArgs === undefined) {
        return {};
    }

    const fromArray = fromKeyValueArray(rawArgs);
    if (fromArray) {
        return normalizeToolInput(fromArray);
    }

    if (typeof rawArgs === "string") {
        const trimmed = rawArgs.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            const parsed = attemptParseJson(trimmed);
            if (isPlainObject(parsed)) {
                return normalizeToolInput(parsed);
            }
        }
        return {};
    }

    if (!isPlainObject(rawArgs)) {
        return {};
    }

    const nested = unwrapNested(rawArgs, ["parameters", "args", "input", "data", "payload"]);
    if (nested) {
        return normalizeToolInput(nested);
    }

    const normalized = { ...rawArgs };

    const arrayLikeKeys = ["parameters", "args", "input", "data", "payload"];
    for (const key of arrayLikeKeys) {
        const value = normalized[key];
        if (Array.isArray(value)) {
            const flattened = fromKeyValueArray(value);
            if (flattened) {
                for (const [flattenedKey, flattenedValue] of Object.entries(flattened)) {
                    if (!(flattenedKey in normalized)) {
                        normalized[flattenedKey] = flattenedValue;
                    }
                }
            }
        }
    }

    const getString = (value: unknown): string | undefined =>
        typeof value === "string" && value.trim().length ? value : undefined;

    const assignFrom = (target: string, sources: string[]) => {
        if (getString(normalized[target]) !== undefined) {
            return;
        }
        for (const source of sources) {
            const candidate = getString(normalized[source]);
            if (candidate !== undefined) {
                normalized[target] = candidate;
                return;
            }
        }
    };

    assignFrom("task", ["goal", "prompt", "question", "topic"]);
    assignFrom("goal", ["task", "prompt", "question", "topic", "claim", "problem"]);
    assignFrom("topic", ["goal", "task", "question", "prompt"]);
    assignFrom("claim", ["goal", "topic", "proposal", "statement"]);
    assignFrom("observations", ["goal", "context", "topic", "claim", "question", "prompt"]);
    assignFrom("query", ["goal", "question", "prompt", "topic"]);
    assignFrom("prompt", ["goal", "task", "topic"]);
    assignFrom("proposal", ["goal", "plan", "claim"]);

    const ensureStringFields = new Set([
        "goal",
        "task",
        "topic",
        "claim",
        "observations",
        "query",
        "prompt",
        "proposal",
        "context",
        "question",
    ]);

    for (const key of ensureStringFields) {
        const value = normalized[key];
        const coerced = coerceString(value);
        if (coerced !== undefined) {
            normalized[key] = coerced;
        }
    }

    return normalized;
}
