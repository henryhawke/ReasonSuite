import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Script, createContext } from "node:vm";
import { jsonResult, type ToolCallback } from "../lib/mcp.js";

type ExecResult = {
    stdout: string[];
    stderr: string[];
    result?: unknown;
    timedOut: boolean;
};

type TimerHandler = Parameters<typeof setTimeout>[0];

const InputSchema = z.object({
    code: z
        .string()
        .describe("JavaScript source to run. If the user provided fenced code, pass the content between the fences."),
    timeout_ms: z.number().int().min(10).max(10_000).default(1500),
});

const inputSchema = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

function runInSandbox(code: string, timeoutMs: number): ExecResult {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
    const activeIntervals = new Set<ReturnType<typeof setInterval>>();

    const cleanupTimers = () => {
        for (const handle of activeTimeouts) {
            clearTimeout(handle);
        }
        for (const handle of activeIntervals) {
            clearInterval(handle);
        }
        activeTimeouts.clear();
        activeIntervals.clear();
    };

    const sandboxConsole = {
        log: (...args: unknown[]) => stdout.push(args.map(String).join(" ")),
        error: (...args: unknown[]) => stderr.push(args.map(String).join(" ")),
        warn: (...args: unknown[]) => stderr.push(args.map(String).join(" ")),
    } as const;

    const trackedSetTimeout = (
        handler: TimerHandler,
        timeout?: number,
        ...args: any[]
    ): ReturnType<typeof setTimeout> => {
        if (typeof handler !== "function") {
            const message = "setTimeout in exec sandbox requires a function handler.";
            stderr.push(message);
            throw new TypeError(message);
        }
        let handle: ReturnType<typeof setTimeout>;
        const wrappedHandler = (...cbArgs: any[]) => {
            activeTimeouts.delete(handle);
            try {
                (handler as (...innerArgs: any[]) => unknown)(...cbArgs);
            } catch (err) {
                stderr.push((err as Error)?.stack ?? String(err));
            }
        };
        handle = setTimeout(wrappedHandler, timeout, ...args);
        activeTimeouts.add(handle);
        return handle;
    };

    const trackedSetInterval = (
        handler: TimerHandler,
        timeout?: number,
        ...args: any[]
    ): ReturnType<typeof setInterval> => {
        if (typeof handler !== "function") {
            const message = "setInterval in exec sandbox requires a function handler.";
            stderr.push(message);
            throw new TypeError(message);
        }
        const wrappedHandler = (...cbArgs: any[]) => {
            try {
                (handler as (...innerArgs: any[]) => unknown)(...cbArgs);
            } catch (err) {
                stderr.push((err as Error)?.stack ?? String(err));
            }
        };
        const handle = setInterval(wrappedHandler, timeout, ...args);
        activeIntervals.add(handle);
        return handle;
    };

    const trackedClearTimeout = (handle: ReturnType<typeof setTimeout> | undefined): void => {
        if (handle) {
            activeTimeouts.delete(handle);
            clearTimeout(handle);
        }
    };

    const trackedClearInterval = (handle: ReturnType<typeof setInterval> | undefined): void => {
        if (handle) {
            activeIntervals.delete(handle);
            clearInterval(handle);
        }
    };

    const sandbox: Record<string, unknown> = {
        console: sandboxConsole,
        print: (v: unknown) => stdout.push(String(v)),
        setTimeout: trackedSetTimeout,
        setInterval: trackedSetInterval,
        clearTimeout: trackedClearTimeout,
        clearInterval: trackedClearInterval,
    };

    const context = createContext(sandbox, { codeGeneration: { strings: true, wasm: false } });
    let result: unknown;
    let timedOut = false;
    try {
        const script = new Script(code, { filename: "exec.js" });
        result = script.runInContext(context, { timeout: timeoutMs });
    } catch (err: unknown) {
        if (String((err as Error)?.message ?? err).includes("Script execution timed out")) {
            timedOut = true;
        } else {
            stderr.push((err as Error)?.stack ?? String(err));
        }
    } finally {
        cleanupTimers();
    }

    return { stdout, stderr, result, timedOut };
}

export function registerExec(server: McpServer): void {
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        const parsed = InputSchema.safeParse(rawArgs);
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for exec.run", issues: parsed.error.issues });
        }
        const { code, timeout_ms } = parsed.data;
        const result = runInSandbox(code, timeout_ms);
        const payload: ExecResult = {
            stdout: result.stdout,
            stderr: result.stderr,
            result: result.result,
            timedOut: result.timedOut,
        };
        return jsonResult(payload);
    };

    server.registerTool(
        "exec.run",
        {
            title: "Run sandboxed JavaScript code",
            description:
                "Execute JavaScript code in a secure VM sandbox with a time limit. Captures print()/console.log output.",
            inputSchema: inputSchema,
        },
        handler
    );
    // Back-compat alias
    server.registerTool(
        "exec_run",
        { title: "Run sandboxed JavaScript code (alias)", description: "Alias for exec.run (back-compat)." },
        handler
    );
}
