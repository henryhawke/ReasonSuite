import { z } from "zod";
import { directLLMSample } from "./llm.js";
import { config } from "./config.js";
export const ReasoningMetadataSchema = z.object({
    source: z.enum(["model", "fallback"]),
    warnings: z.array(z.string()).default([]),
    raw: z.string().optional(),
    prompt_chars: z.number().optional(),
    prompt_tokens_estimate: z.number().optional(),
    response_chars: z.number().optional(),
    response_tokens_estimate: z.number().optional(),
});
function resolveFallback(fallback) {
    return typeof fallback === "function" ? fallback() : fallback;
}
function clonePayload(value) {
    if (typeof globalThis.structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
}
function attachMeta(payload, meta) {
    const cloned = clonePayload(payload ?? {});
    const existing = cloned?.meta ?? {};
    const warnings = Array.from(new Set([...(existing.warnings ?? []), ...(meta.warnings ?? [])].filter((w) => typeof w === "string")));
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
function estimateTokens(text) {
    const normalized = text.trim();
    if (!normalized) {
        return 0;
    }
    return Math.max(1, Math.ceil(normalized.length / 4));
}
function buildCandidates(raw) {
    const trimmed = raw.trim();
    const { maxCandidateLength, maxCandidateCount } = config.memoryProfile;
    const candidates = new Set();
    if (!trimmed) {
        return [];
    }
    if (trimmed.length <= maxCandidateLength) {
        candidates.add(trimmed);
    }
    const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
    if (fenced?.[1]) {
        const candidate = fenced[1].trim();
        if (candidate.length <= maxCandidateLength) {
            candidates.add(candidate);
        }
    }
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const braceCandidate = trimmed.slice(firstBrace, lastBrace + 1).trim();
        if (braceCandidate.length <= maxCandidateLength) {
            candidates.add(braceCandidate);
        }
    }
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const bracketCandidate = trimmed.slice(firstBracket, lastBracket + 1).trim();
        if (bracketCandidate.length <= maxCandidateLength) {
            candidates.add(bracketCandidate);
        }
    }
    return Array.from(candidates.values())
        .filter((candidate) => candidate.length > 0)
        .slice(0, maxCandidateCount);
}
function tryParse(candidate) {
    try {
        return { success: true, value: JSON.parse(candidate) };
    }
    catch (err) {
        return { success: false, error: err?.message ?? String(err) };
    }
}
export async function sampleStructuredJson({ server, prompt, maxTokens, schema, fallback }) {
    const warnings = [];
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
        }
        else {
            const reason = llmResult?.reason ?? "Unknown error";
            if (reason.includes("local mode")) {
                warnings.push("Running in local mode - using deterministic fallback.");
            }
            else {
                warnings.push(`Direct LLM sampling failed: ${reason}`);
            }
        }
    }
    catch (err) {
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
            return { data, text: JSON.stringify(data), usedFallback: false };
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
    return { data, text: JSON.stringify(data), usedFallback: true };
}
