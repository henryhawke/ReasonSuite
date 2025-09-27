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
    return cloned;
}

function buildCandidates(raw: string): string[] {
    const trimmed = raw.trim();
    const candidates = new Set<string>();
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

    const hasMcpSampler = typeof (server as any)?.server?.createMessage === "function";
    if (hasMcpSampler) {
        const clientCapabilities =
            typeof (server as any)?.server?.getClientCapabilities === "function"
                ? (server as any).server.getClientCapabilities()
                : undefined;
        if (clientCapabilities && !clientCapabilities.sampling) {
            warnings.push("Connected MCP client does not advertise sampling support.");
        } else {
            try {
                const response = await server.server.createMessage({
                    messages: [{ role: "user", content: { type: "text", text: prompt } }],
                    maxTokens,
                });
                const content: any = (response as any)?.content;
                if (content && typeof content?.text === "string") {
                    raw = content.text;
                } else if (Array.isArray(content)) {
                    const textPart = content.find((part: any) => typeof part?.text === "string");
                    raw = textPart?.text ?? "";
                } else {
                    warnings.push("LLM response did not include text content.");
                }
            } catch (err: any) {
                const message = err?.message ?? String(err);
                if (typeof message === "string" && message.includes("MCP servers cannot make LLM calls")) {
                    warnings.push("MCP host rejected sampling requests from this server; attempting direct fallback.");
                } else {
                    warnings.push(`LLM sampling failed: ${message}`);
                }
            }
        }
    } else {
        warnings.push("MCP host sampling is unavailable (no createMessage implementation).");
    }

    if (!raw.trim()) {
        const direct = await directLLMSample(prompt, maxTokens);
        if (direct) {
            if (direct.success) {
                raw = direct.raw;
                warnings.push(...direct.warnings);
            } else {
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
            return { data, text: JSON.stringify(data, null, 2), usedFallback: false as const };
        }
        warnings.push(`Schema validation error: ${validated.error.message}`);
    }

    const fallbackValue = resolveFallback(fallback);
    const data = attachMeta(fallbackValue, {
        source: "fallback",
        warnings: warnings.length ? warnings : ["Used deterministic fallback output."],
        raw: raw.trim() || undefined,
    });
    return { data, text: JSON.stringify(data, null, 2), usedFallback: true as const };
}

export type SampleStructuredResult<T> = Awaited<ReturnType<typeof sampleStructuredJson<T>>>;
