import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult } from "../lib/mcp.js";
import { DEFAULT_RAZORS } from "../lib/razors.js";

const InputSchema = z
    .object({
        mode: z.enum([
            "plan",
            "socratic",
            "dialectic",
            "abductive",
            "razors",
            "analogical",
            "systems",
            "redblue",
            "scientific",
            "self_explain",
            "divergent",
            "constraint",
        ]),
    })
    .passthrough();

const inputSchema = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;

const MODE_TO_TOOL: Record<InputArgs["mode"], string> = {
    plan: "reasoning.router.plan",
    socratic: "socratic.inquire",
    dialectic: "dialectic.tas",
    abductive: "abductive.hypothesize",
    razors: "razors.apply",
    analogical: "analogical.map",
    systems: "systems.map",
    redblue: "redblue.challenge",
    scientific: "reasoning.scientific",
    self_explain: "reasoning.self_explain",
    divergent: "reasoning.divergent_convergent",
    constraint: "constraint.solve",
};

type UnknownSchema = z.ZodTypeAny;

type ResolvedHandler = {
    callback: ToolCallback<any>;
    inputSchema?: UnknownSchema;
};

function resolveHandler(server: McpServer, toolName: string): ResolvedHandler | undefined {
    const internalTools = (server as unknown as {
        _registeredTools?: Record<string, { callback: ToolCallback<any>; inputSchema?: UnknownSchema }>;
    })._registeredTools;
    const internal = internalTools?.[toolName];
    if (internal) {
        return { callback: internal.callback, inputSchema: internal.inputSchema };
    }
    const maybeMap = (server as unknown as { tools?: Map<string, ToolCallback<any>> }).tools;
    if (maybeMap && typeof maybeMap.get === "function") {
        const candidate = maybeMap.get(toolName);
        if (candidate) {
            return { callback: candidate as ToolCallback<any> };
        }
    }
    return undefined;
}

export function registerReasoning(server: McpServer): void {
    const handler: ToolCallback<any> = async (rawArgs, extra) => {
        const parsed = InputSchema.safeParse(rawArgs);
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments", issues: parsed.error.issues });
        }
        const { mode, ...rest } = parsed.data;
        const delegateName = MODE_TO_TOOL[mode];
        const resolved = resolveHandler(server, delegateName);
        if (!resolved) {
            return jsonResult({
                error: `Mode ${mode} is not available; ensure the underlying tool ${delegateName} is registered first.`,
            });
        }
        const normalizedInput = normalizeArgs(mode, rest);
        let args: unknown = normalizedInput;
        if (resolved.inputSchema) {
            const parsedArgs = resolved.inputSchema.safeParse(normalizedInput);
            if (!parsedArgs.success) {
                return jsonResult({ error: "Invalid arguments", issues: parsedArgs.error.issues });
            }
            args = parsedArgs.data;
        }
        const callable = resolved.callback as unknown as (input: unknown, extra: unknown) => Promise<unknown>;
        return (await callable(args, extra)) as any;
    };

    server.registerTool(
        "reasoning.run",
        {
            title: "Unified reasoning tool dispatcher",
            description:
                "Route a request to any ReasonSuite reasoning tool by specifying a mode (plan, socratic, dialectic, abductive, razors, analogical, systems, redblue, scientific, self_explain, divergent, constraint).",
            inputSchema,
        },
        handler
    );
}

function normalizeArgs(mode: InputArgs["mode"], raw: Record<string, unknown>): Record<string, unknown> {
    const args: Record<string, unknown> = { ...raw };
    if (mode === "abductive" && !("apply_razors" in args)) {
        args.apply_razors = [...DEFAULT_RAZORS];
    }
    if (mode === "razors") {
        if (!("razors" in args)) {
            args.razors = [...DEFAULT_RAZORS];
        }
        const candidates = args.candidates_json;
        if (candidates && typeof candidates !== "string") {
            try {
                args.candidates_json = JSON.stringify(candidates);
            } catch {
                // leave as-is to allow downstream validation to report the issue
            }
        }
    }
    if (mode === "constraint") {
        const candidate = args.model_json;
        if (candidate && typeof candidate === "object") {
            try {
                args.model_json = JSON.stringify(candidate);
            } catch {
                // leave as-is so downstream validation can surface the issue
            }
        }
    }
    return args;
}
