import os from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult, type ToolCallback } from "../lib/mcp.js";
import { normalizeToolInput } from "../lib/args.js";
import { DEFAULT_RAZORS } from "../lib/razors.js";
import { SIGNAL_DESCRIPTIONS } from "../router/signals.js";
import type { ServerDiagnostics } from "../lib/server_state.js";

type Identity = {
    name: string;
    version: string;
};

const InputSchema = z
    .object({
        detail: z.enum(["summary", "full"]).default("full"),
        pretty: z.boolean().default(false),
        include_router_signals: z.boolean().default(true),
    })
    .partial({ pretty: true, include_router_signals: true });

const inputSchema = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;

type DiagnosticsPayload = {
    status: "ok" | "warn";
    generated_at: string;
    server: {
        name: string;
        version: string;
        mode?: {
            transport: string;
            description: string;
            localMode: boolean;
        };
        started_at: string;
        uptime_ms: number;
    };
    counts: {
        tools: number;
        prompts: number;
        resources: number;
    };
    environment: {
        node: string;
        platform: string;
        pid: number;
        release: string;
        cpus: number;
    };
    notes: string[];
    tools?: Array<{
        name: string;
        title?: string;
        description?: string;
        has_schema: boolean;
    }>;
    prompts?: Array<{
        name: string;
        title?: string;
        description?: string;
        has_args: boolean;
    }>;
    resources?: Array<{
        id: string;
        title?: string;
        description?: string;
        uri?: string;
        path?: string;
        status?: string;
        error?: string;
    }>;
    heuristics?: {
        default_razors: string[];
        router_signals?: Record<string, string>;
    };
};

export function registerDiagnostics(server: McpServer, diagnostics: ServerDiagnostics, identity: Identity): void {
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        const parsed = InputSchema.safeParse(normalizeToolInput(rawArgs));
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for reasoning.diagnostics", issues: parsed.error.issues });
        }

        const { detail, pretty, include_router_signals } = parsed.data as InputArgs;
        const snapshot = await diagnostics.snapshot();

        const payload: DiagnosticsPayload = {
            status: snapshot.notes.length ? "warn" : "ok",
            generated_at: new Date().toISOString(),
            server: {
                name: identity.name,
                version: identity.version,
                mode: snapshot.mode,
                started_at: snapshot.startedAt,
                uptime_ms: snapshot.uptimeMs,
            },
            counts: snapshot.counts,
            environment: {
                node: process.version,
                platform: `${process.platform}-${process.arch}`,
                pid: process.pid,
                release: os.release(),
                cpus: os.cpus().length,
            },
            notes: snapshot.notes,
        };

        if (detail === "full") {
            payload.tools = snapshot.tools.map((tool) => ({
                name: tool.name,
                title: tool.title,
                description: tool.description,
                has_schema: Boolean(tool.inputSchema),
            }));
            payload.prompts = snapshot.prompts.map((prompt) => ({
                name: prompt.name,
                title: prompt.title,
                description: prompt.description,
                has_args: Boolean(prompt.argsSchema),
            }));
            payload.resources = snapshot.resources.map((resource) => ({
                id: resource.id,
                title: resource.title,
                description: resource.description,
                uri: resource.uri,
                path: resource.path,
                status: resource.status,
                error: resource.error,
            }));
        }

        payload.heuristics = {
            default_razors: [...DEFAULT_RAZORS],
            router_signals: include_router_signals ? { ...SIGNAL_DESCRIPTIONS } : undefined,
        };

        return jsonResult(payload, { pretty });
    };

    server.registerTool(
        "reasoning.diagnostics",
        {
            title: "ReasonSuite diagnostics",
            description:
                "Summarise server status, environment, registered tools/prompts/resources, and key heuristic stacks.",
            inputSchema,
        },
        handler
    );
}
