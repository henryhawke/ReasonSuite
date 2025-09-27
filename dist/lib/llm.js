import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
function readEnv(name) {
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
async function postJson(urlString, body, headers) {
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
export async function directLLMSample(prompt, maxTokens) {
    const providers = [];
    if (readEnv("OPENAI_API_KEY")) {
        providers.push({ label: "openai", invoke: () => callOpenAI(prompt, maxTokens) });
    }
    if (readEnv("ANTHROPIC_API_KEY")) {
        providers.push({ label: "anthropic", invoke: () => callAnthropic(prompt, maxTokens) });
    }
    if (providers.length === 0) {
        return null;
    }
    const errors = [];
    for (const { label, invoke } of providers) {
        try {
            const { raw, provider } = await invoke();
            return {
                success: true,
                raw,
                provider,
                warnings: [`Used direct ${provider} fallback because MCP host sampling was unavailable.`],
            };
        }
        catch (error) {
            errors.push(`${label}: ${error?.message ?? String(error)}`);
        }
    }
    return {
        success: false,
        reason: errors.join("; ") || "Direct LLM fallback failed",
    };
}
