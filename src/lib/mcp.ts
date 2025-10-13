import type { CallToolResult, TextContent } from "@modelcontextprotocol/sdk/types.js";

export type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";

export function textContent(text: string): TextContent {
    return { type: "text", text };
}

export function textResult(text: string): CallToolResult {
    return { content: [textContent(text)] };
}

export function jsonResult(value: unknown, { pretty = false }: { pretty?: boolean } = {}): CallToolResult {
    if (typeof value === "string") {
        return textResult(value);
    }
    try {
        const spacing = pretty ? 2 : undefined;
        return textResult(JSON.stringify(value, null, spacing));
    } catch (error) {
        return textResult(String(value));
    }
}
