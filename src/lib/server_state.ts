import fs from "node:fs/promises";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

type ToolMeta = {
    name: string;
    title?: string;
    description?: string;
    inputSchema?: unknown;
};

type PromptMeta = {
    name: string;
    title?: string;
    description?: string;
    argsSchema?: unknown;
};

type ResourceMeta = {
    id: string;
    uri?: string;
    title?: string;
    description?: string;
    mimeType?: string;
    path?: string;
    status?: "ok" | "missing" | "unknown";
    error?: string;
};

type ModeMeta = {
    transport: string;
    description: string;
    localMode: boolean;
};

type Snapshot = {
    startedAt: string;
    uptimeMs: number;
    tools: ToolMeta[];
    prompts: PromptMeta[];
    resources: ResourceMeta[];
    counts: { tools: number; prompts: number; resources: number };
    mode?: ModeMeta;
    notes: string[];
};

type RecordResourceOptions = {
    path?: string;
    status?: ResourceMeta["status"];
    error?: string;
};

export type ServerDiagnostics = {
    snapshot(): Promise<Snapshot>;
    setMode(meta: ModeMeta): void;
    recordResource(id: string, options: RecordResourceOptions): void;
};

export function attachServerDiagnostics(server: McpServer): ServerDiagnostics {
    const tools = new Map<string, ToolMeta>();
    const prompts = new Map<string, PromptMeta>();
    const resources = new Map<string, ResourceMeta>();
    const startedAt = new Date();
    let modeMeta: ModeMeta | undefined;

    const patched = server as McpServer & {
        registerTool: McpServer["registerTool"];
        registerPrompt: McpServer["registerPrompt"];
        registerResource: McpServer["registerResource"];
    };

    const originalRegisterTool = patched.registerTool.bind(server);
    patched.registerTool = ((name: string, def: Parameters<McpServer["registerTool"]>[1], handler: any) => {
        tools.set(name, {
            name,
            title: (def as any)?.title,
            description: (def as any)?.description,
            inputSchema: (def as any)?.inputSchema,
        });
        return originalRegisterTool(name, def as any, handler);
    }) as McpServer["registerTool"];

    const originalRegisterPrompt = patched.registerPrompt.bind(server);
    patched.registerPrompt = ((name: string, def: Parameters<McpServer["registerPrompt"]>[1], handler: any) => {
        prompts.set(name, {
            name,
            title: (def as any)?.title,
            description: (def as any)?.description,
            argsSchema: (def as any)?.argsSchema,
        });
        return originalRegisterPrompt(name, def as any, handler);
    }) as McpServer["registerPrompt"];

    const originalRegisterResource = patched.registerResource.bind(server);
    patched.registerResource = ((...args: Parameters<McpServer["registerResource"]>) => {
        const [name, uriOrTemplate, def] = args;
        const entry = resources.get(name) ?? { id: name };
        const metadata = def as { title?: string; description?: string; mimeType?: string };
        resources.set(name, {
            ...entry,
            id: name,
            uri: typeof uriOrTemplate === "string" ? uriOrTemplate : entry.uri,
            title: metadata?.title ?? entry.title,
            description: metadata?.description ?? entry.description,
            mimeType: metadata?.mimeType ?? entry.mimeType,
        });
        return originalRegisterResource(...(args as Parameters<McpServer["registerResource"]>));
    }) as McpServer["registerResource"];

    const recordResource = (id: string, options: RecordResourceOptions) => {
        const existing = resources.get(id) ?? { id };
        resources.set(id, {
            ...existing,
            ...options,
        });
    };

    const snapshot = async (): Promise<Snapshot> => {
        const uptimeMs = Date.now() - startedAt.getTime();
        const notes: string[] = [];

        const resourceList = await Promise.all(
            Array.from(resources.values())
                .sort((a, b) => a.id.localeCompare(b.id))
                .map(async (entry) => {
                    const next = { ...entry } satisfies ResourceMeta;
                    if (next.path && next.status !== "missing") {
                        try {
                            await fs.access(next.path);
                            next.status = "ok";
                            next.error = undefined;
                        } catch (error) {
                            next.status = "missing";
                            next.error = (error as Error)?.message ?? String(error);
                        }
                    } else if (!next.status) {
                        next.status = next.path ? "unknown" : "missing";
                    }
                    return next;
                })
        );

        const missingResources = resourceList.filter((entry) => entry.status === "missing");
        if (missingResources.length > 0) {
            notes.push(
                `Missing ${missingResources.length} resource(s): ${missingResources.map((r) => r.id).join(", ")}. ` +
                    "Set REASONSUITE_RESOURCES to include the directory containing the markdown files."
            );
        }

        if (!modeMeta) {
            notes.push("Transport mode not initialised; server may not have connected yet.");
        }

        return {
            startedAt: startedAt.toISOString(),
            uptimeMs,
            tools: Array.from(tools.values()).sort((a, b) => a.name.localeCompare(b.name)),
            prompts: Array.from(prompts.values()).sort((a, b) => a.name.localeCompare(b.name)),
            resources: resourceList,
            counts: { tools: tools.size, prompts: prompts.size, resources: resources.size },
            mode: modeMeta,
            notes,
        } satisfies Snapshot;
    };

    return {
        snapshot,
        setMode(meta: ModeMeta) {
            modeMeta = meta;
        },
        recordResource,
    } satisfies ServerDiagnostics;
}
