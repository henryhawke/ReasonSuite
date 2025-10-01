import { z } from "zod";
import { directLLMSample } from "./llm.js";
export const ReasoningMetadataSchema = z.object({
    source: z.enum(["model", "fallback"]),
    warnings: z.array(z.string()).default([]),
    raw: z.string().optional(),
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
    return cloned;
}
function buildCandidates(raw) {
    const trimmed = raw.trim();
    const MAX_CANDIDATE_LENGTH = 50_000;
    const MAX_CANDIDATE_COUNT = 6;
    const candidates = new Set();
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
            const data = attachMeta(validated.data, {
                source: "model",
                warnings,
                raw: raw.trim() || undefined,
            });
            return { data, text: JSON.stringify(data, null, 2), usedFallback: false };
        }
        warnings.push(`Schema validation error: ${validated.error.message}`);
    }
    const fallbackValue = resolveFallback(fallback);
    const data = attachMeta(fallbackValue, {
        source: "fallback",
        warnings: warnings.length ? warnings : ["Used deterministic fallback output."],
        raw: raw.trim() || undefined,
    });
    return { data, text: JSON.stringify(data, null, 2), usedFallback: true };
}
