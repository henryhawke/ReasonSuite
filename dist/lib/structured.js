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
    const candidates = new Set();
    if (!trimmed) {
        return [];
    }
    candidates.add(trimmed);
    const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
    if (fenced?.[1]) {
        candidates.add(fenced[1].trim());
    }
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        candidates.add(trimmed.slice(firstBrace, lastBrace + 1).trim());
    }
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        candidates.add(trimmed.slice(firstBracket, lastBracket + 1).trim());
    }
    return Array.from(candidates.values()).filter((candidate) => candidate.length > 0);
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
    const hasMcpSampler = typeof server?.server?.createMessage === "function";
    if (hasMcpSampler) {
        const clientCapabilities = typeof server?.server?.getClientCapabilities === "function"
            ? server.server.getClientCapabilities()
            : undefined;
        if (clientCapabilities && !clientCapabilities.sampling) {
            warnings.push("Connected MCP client does not advertise sampling support.");
        }
        else {
            try {
                const response = await server.server.createMessage({
                    messages: [{ role: "user", content: { type: "text", text: prompt } }],
                    maxTokens,
                });
                const content = response?.content;
                if (content && typeof content?.text === "string") {
                    raw = content.text;
                }
                else if (Array.isArray(content)) {
                    const textPart = content.find((part) => typeof part?.text === "string");
                    raw = textPart?.text ?? "";
                }
                else {
                    warnings.push("LLM response did not include text content.");
                }
            }
            catch (err) {
                const message = err?.message ?? String(err);
                if (typeof message === "string" && message.includes("MCP servers cannot make LLM calls")) {
                    warnings.push("MCP host rejected sampling requests from this server; attempting direct fallback.");
                }
                else {
                    warnings.push(`LLM sampling failed: ${message}`);
                }
            }
        }
    }
    else {
        warnings.push("MCP host sampling is unavailable (no createMessage implementation).");
    }
    if (!raw.trim()) {
        const direct = await directLLMSample(prompt, maxTokens);
        if (direct) {
            if (direct.success) {
                raw = direct.raw;
                warnings.push(...direct.warnings);
            }
            else {
                warnings.push(`Direct LLM fallback failed: ${direct.reason}`);
            }
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
