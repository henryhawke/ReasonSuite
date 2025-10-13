import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { directLLMSample } from "./llm.js";

type FallbackValue<T> = T | (() => T);

type SampleStructuredOptions<T> = {
    server: McpServer;
    prompt: string;
    maxTokens: number;
    schema: z.ZodType<T>;
    fallback: FallbackValue<T>;
};

export const ReasoningMetadataSchema = z.object({
    source: z.enum(["model", "fallback"]),
    warnings: z.array(z.string()).default([]),
    raw: z.string().optional(),
    prompt_chars: z.number().optional(),
    prompt_tokens_estimate: z.number().optional(),
    response_chars: z.number().optional(),
    response_tokens_estimate: z.number().optional(),
});

type ReasoningMetadata = z.infer<typeof ReasoningMetadataSchema>;

function resolveFallback<T>(fallback: FallbackValue<T>): T {
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
}

function clonePayload<T>(value: T): T {
    if (typeof globalThis.structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
}

function attachMeta<T>(payload: T, meta: ReasoningMetadata): T {
    const cloned: any = clonePayload(payload ?? {});
    const existing = cloned?.meta ?? {};
    const warnings = Array.from(
        new Set([...(existing.warnings ?? []), ...(meta.warnings ?? [])].filter((w): w is string => typeof w === "string"))
    );
    cloned.meta = { ...existing, ...meta, warnings };
    if (!cloned.meta.raw) {
        delete cloned.meta.raw;
    }
    if (!cloned.meta.warnings?.length) {
        delete cloned.meta.warnings;
    }
    if (!cloned.meta.prompt_chars) {
        delete cloned.meta.prompt_chars;
    }
    if (!cloned.meta.prompt_tokens_estimate) {
        delete cloned.meta.prompt_tokens_estimate;
    }
    if (!cloned.meta.response_chars) {
        delete cloned.meta.response_chars;
    }
    if (!cloned.meta.response_tokens_estimate) {
        delete cloned.meta.response_tokens_estimate;
    }
    return cloned;
}

function estimateTokens(text: string): number {
    const normalized = text.trim();
    if (!normalized) {
        return 0;
    }
    return Math.max(1, Math.ceil(normalized.length / 4));
}

function buildCandidates(raw: string): string[] {
    const trimmed = raw.trim();
    const MAX_CANDIDATE_LENGTH = 50_000;
    const MAX_CANDIDATE_COUNT = 6;
    const candidates = new Set<string>();
    if (!trimmed) {
        return [];
    }
    if (trimmed.length <= MAX_CANDIDATE_LENGTH) {
        candidates.add(trimmed);
    }
    const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
    if (fenced?.[1]) {
        const candidate = fenced[1].trim();
        if (candidate.length <= MAX_CANDIDATE_LENGTH) {
            candidates.add(candidate);
        }
    }
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const braceCandidate = trimmed.slice(firstBrace, lastBrace + 1).trim();
        if (braceCandidate.length <= MAX_CANDIDATE_LENGTH) {
            candidates.add(braceCandidate);
        }
    }
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const bracketCandidate = trimmed.slice(firstBracket, lastBracket + 1).trim();
        if (bracketCandidate.length <= MAX_CANDIDATE_LENGTH) {
            candidates.add(bracketCandidate);
        }
    }
    return Array.from(candidates.values())
        .filter((candidate) => candidate.length > 0)
        .slice(0, MAX_CANDIDATE_COUNT);
}

function tryParse(candidate: string) {
    try {
        return { success: true as const, value: JSON.parse(candidate) };
    } catch (err: any) {
        return { success: false as const, error: err?.message ?? String(err) };
    }
}

export async function sampleStructuredJson<T>({ server, prompt, maxTokens, schema, fallback }: SampleStructuredOptions<T>) {
    const warnings: string[] = [];
    let raw = "";
    const promptMetrics = {
        prompt_chars: prompt.length,
        prompt_tokens_estimate: estimateTokens(prompt),
    };

    // Try to use direct LLM sampling first (unless in local mode)
    try {
        const llmResult = await directLLMSample(prompt, maxTokens);
        if (llmResult && llmResult.success) {
            raw = llmResult.raw;
        } else {
            const reason = llmResult?.reason ?? "Unknown error";
            if (reason.includes("local mode")) {
                warnings.push("Running in local mode - using deterministic fallback.");
            } else {
                warnings.push(`Direct LLM sampling failed: ${reason}`);
            }
        }
    } catch (err: any) {
        warnings.push(`Direct LLM sampling failed: ${err.message}`);
    }

    if (!raw.trim()) {
        // Don't add redundant warning if we already noted local mode
        if (!warnings.some(w => w.includes("local mode"))) {
            warnings.push("No response from LLM sampling; using deterministic fallback.");
        }
    }

    const candidates = buildCandidates(raw);
    for (const candidate of candidates) {
        const parsed = tryParse(candidate);
        if (!parsed.success) {
            warnings.push(`JSON parse error: ${parsed.error}`);
            continue;
        }
        const validated = schema.safeParse(parsed.value);
        if (validated.success) {
            const responseText = raw.trim();
            const data = attachMeta(validated.data, {
                source: "model",
                warnings,
                raw: responseText || undefined,
                ...promptMetrics,
                response_chars: responseText.length,
                response_tokens_estimate: estimateTokens(responseText),
            });
            return { data, text: JSON.stringify(data), usedFallback: false as const };
        }
        warnings.push(`Schema validation error: ${validated.error.message}`);
    }

    const fallbackValue = resolveFallback(fallback);
    const fallbackJson = JSON.stringify(fallbackValue);
    const data = attachMeta(fallbackValue, {
        source: "fallback",
        warnings: warnings.length ? warnings : ["Used deterministic fallback output."],
        raw: raw.trim() || undefined,
        ...promptMetrics,
        response_chars: fallbackJson.length,
        response_tokens_estimate: estimateTokens(fallbackJson),
    });
    return { data, text: JSON.stringify(data), usedFallback: true as const };
}

export type SampleStructuredResult<T> = Awaited<ReturnType<typeof sampleStructuredJson<T>>>;
