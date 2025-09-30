import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
let dotenvLoaded = false;
function loadDotenvIfNeeded() {
    if (dotenvLoaded)
        return;
    dotenvLoaded = true;
    try {
        const envPath = path.resolve(process.cwd(), ".env");
        if (!fs.existsSync(envPath))
            return;
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#"))
                continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx === -1)
                continue;
            const key = trimmed.slice(0, eqIdx).trim();
            const value = trimmed.slice(eqIdx + 1).trim();
            if (key && !(key in process.env)) {
                process.env[key] = value;
            }
        }
    }
    catch {
        // Ignore dotenv loading errors; environment may already be configured
    }
}
function readEnv(name) {
    loadDotenvIfNeeded();
    const value = process.env[name];
    if (!value) {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function collectBody(res) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        res.on("data", (chunk) => {
            chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        });
        res.on("end", () => {
            resolve(Buffer.concat(chunks).toString("utf-8"));
        });
        res.on("error", (err) => reject(err));
    });
}
async function postJson(urlString, body, headers, timeoutMs = 15000) {
    const url = new URL(urlString);
    const payload = JSON.stringify(body);
    const isHttps = url.protocol === "https:";
    const transport = isHttps ? https : http;
    return new Promise((resolve, reject) => {
        const req = transport.request({
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: "POST",
            headers: {
                "content-type": "application/json",
                "content-length": Buffer.byteLength(payload).toString(),
                ...headers,
            },
        }, async (res) => {
            try {
                const raw = await collectBody(res);
                const status = res.statusCode ?? 0;
                if (status < 200 || status >= 300) {
                    reject(new Error(`HTTP ${status}: ${raw}`));
                    return;
                }
                if (!raw) {
                    resolve(undefined);
                    return;
                }
                try {
                    resolve(JSON.parse(raw));
                }
                catch (error) {
                    reject(new Error(`Failed to parse JSON response: ${error?.message ?? String(error)}`));
                }
            }
            catch (error) {
                reject(error);
            }
        });
        req.setTimeout(timeoutMs, () => {
            req.destroy();
            reject(new Error(`Request timeout after ${timeoutMs}ms`));
        });
        req.on("error", (err) => reject(err));
        req.write(payload);
        req.end();
    });
}
async function callOpenAI(prompt, maxTokens) {
    const apiKey = readEnv("OPENAI_API_KEY");
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY not configured");
    }
    const model = readEnv("OPENAI_MODEL") ?? "gpt-4o-mini";
    const temperature = Number(readEnv("OPENAI_TEMPERATURE") ?? "0.2");
    const body = {
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: Number.isFinite(temperature) ? temperature : 0.2,
        max_tokens: maxTokens,
    };
    const response = await postJson(readEnv("OPENAI_BASE_URL") ?? "https://api.openai.com/v1/chat/completions", body, {
        Authorization: `Bearer ${apiKey}`,
    });
    const text = response?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
        throw new Error("OpenAI response did not include text content");
    }
    return { raw: text, provider: `openai:${model}` };
}
async function callAnthropic(prompt, maxTokens) {
    const apiKey = readEnv("ANTHROPIC_API_KEY");
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY not configured");
    }
    const model = readEnv("ANTHROPIC_MODEL") ?? "claude-3-haiku-20240307";
    const version = readEnv("ANTHROPIC_VERSION") ?? "2023-06-01";
    const body = {
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
    };
    const response = await postJson(readEnv("ANTHROPIC_BASE_URL") ?? "https://api.anthropic.com/v1/messages", body, {
        "x-api-key": apiKey,
        "anthropic-version": version,
    });
    const parts = Array.isArray(response?.content) ? response.content : [];
    const text = parts
        .map((part) => (typeof part?.text === "string" ? part.text : ""))
        .filter((chunk) => chunk.length > 0)
        .join("\n\n")
        .trim();
    if (!text) {
        throw new Error("Anthropic response did not include text content");
    }
    return { raw: text, provider: `anthropic:${model}` };
}
async function callOpenRouter(prompt, maxTokens) {
    const apiKey = readEnv("OPENROUTER_API_KEY");
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY not configured");
    }
    const model = readEnv("OPENROUTER_MODEL") ?? "meta-llama/llama-3.1-8b-instruct";
    const baseUrl = readEnv("OPENROUTER_BASE_URL") ?? "https://openrouter.ai/api/v1";
    const temperature = Number(readEnv("OPENROUTER_TEMPERATURE") ?? "0.2");
    // Add helpful headers for better rate limiting and debugging
    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/your-repo/reasonsuite", // Replace with your actual repo
        "X-Title": "ReasonSuite",
    };
    const body = {
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: Number.isFinite(temperature) ? temperature : 0.2,
        max_tokens: maxTokens,
    };
    const response = await postJson(`${baseUrl}/chat/completions`, body, headers);
    const text = response?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
        throw new Error("OpenRouter response did not include text content");
    }
    return { raw: text, provider: `openrouter:${model}` };
}
// Simple in-memory cache for LLM responses
const responseCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour TTL
function getCacheKey(prompt, maxTokens) {
    // Use hash for better cache performance with long prompts
    const hash = createHash('md5').update(prompt).digest('hex').substring(0, 8);
    return `${hash}:${maxTokens}`;
}
function getCachedResult(prompt, maxTokens) {
    const key = getCacheKey(prompt, maxTokens);
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.result;
    }
    if (cached) {
        responseCache.delete(key); // Remove expired entry
    }
    return null;
}
function setCacheResult(prompt, maxTokens, result) {
    const key = getCacheKey(prompt, maxTokens);
    responseCache.set(key, { result, timestamp: Date.now() });
}
export function isLocalMode() {
    const localMode = readEnv("REASONSUITE_LOCAL_MODE") ?? readEnv("LOCAL_MODE");
    return localMode === "true" || localMode === "1";
}
export async function directLLMSample(prompt, maxTokens) {
    // Check if running in local mode (no external LLM calls)
    if (isLocalMode()) {
        return {
            success: false,
            reason: "Running in local mode - external LLM calls are disabled. Using deterministic fallback."
        };
    }
    // Check cache first
    const cachedResult = getCachedResult(prompt, maxTokens);
    if (cachedResult) {
        return cachedResult;
    }
    const providers = [
        { name: "OpenRouter", fn: callOpenRouter },
        { name: "OpenAI", fn: callOpenAI },
        { name: "Anthropic", fn: callAnthropic },
    ];
    const errors = [];
    for (const provider of providers) {
        try {
            const result = await provider.fn(prompt, maxTokens);
            const sampleResult = {
                success: true,
                raw: result.raw,
                provider: result.provider,
                warnings: []
            };
            // Cache successful result
            setCacheResult(prompt, maxTokens, sampleResult);
            return sampleResult;
        }
        catch (error) {
            errors.push(`${provider.name} failed: ${error.message}`);
        }
    }
    // All providers failed
    const failureResult = {
        success: false,
        reason: `All providers failed: ${errors.join("; ")}`
    };
    // Cache failure result too (with shorter TTL)
    setCacheResult(prompt, maxTokens, failureResult);
    return failureResult;
}
// Utility functions for cache management and configuration
export function clearLLMCache() {
    responseCache.clear();
}
export function getCacheStats() {
    const now = Date.now();
    let oldestTimestamp = now;
    for (const cached of responseCache.values()) {
        if (cached.timestamp < oldestTimestamp) {
            oldestTimestamp = cached.timestamp;
        }
    }
    return {
        size: responseCache.size,
        maxAge: responseCache.size > 0 ? now - oldestTimestamp : 0,
        ttl: CACHE_TTL
    };
}
export function validateAPIConfiguration() {
    return {
        openai: !!readEnv("OPENAI_API_KEY"),
        anthropic: !!readEnv("ANTHROPIC_API_KEY"),
        openrouter: !!readEnv("OPENROUTER_API_KEY"),
        anyConfigured: !!(readEnv("OPENAI_API_KEY") || readEnv("ANTHROPIC_API_KEY") || readEnv("OPENROUTER_API_KEY"))
    };
}
