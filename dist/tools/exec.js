import { z } from "zod";
import { Script, createContext } from "node:vm";
import { jsonResult } from "../lib/mcp.js";
const InputSchema = z.object({
    code: z
        .string()
        .describe("JavaScript source to run. If the user provided fenced code, pass the content between the fences."),
    timeout_ms: z.number().int().min(10).max(10_000).default(1500),
});
const inputSchema = InputSchema.shape;
function runInSandbox(code, timeoutMs) {
    const stdout = [];
    const stderr = [];
    const activeTimeouts = new Set();
    const activeIntervals = new Set();
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
        log: (...args) => stdout.push(args.map(String).join(" ")),
        error: (...args) => stderr.push(args.map(String).join(" ")),
        warn: (...args) => stderr.push(args.map(String).join(" ")),
    };
    const trackedSetTimeout = (handler, timeout, ...args) => {
        if (typeof handler !== "function") {
            const message = "setTimeout in exec sandbox requires a function handler.";
            stderr.push(message);
            throw new TypeError(message);
        }
        let handle;
        const wrappedHandler = (...cbArgs) => {
            activeTimeouts.delete(handle);
            try {
                handler(...cbArgs);
            }
            catch (err) {
                stderr.push(err?.stack ?? String(err));
            }
        };
        handle = setTimeout(wrappedHandler, timeout, ...args);
        activeTimeouts.add(handle);
        return handle;
    };
    const trackedSetInterval = (handler, timeout, ...args) => {
        if (typeof handler !== "function") {
            const message = "setInterval in exec sandbox requires a function handler.";
            stderr.push(message);
            throw new TypeError(message);
        }
        const wrappedHandler = (...cbArgs) => {
            try {
                handler(...cbArgs);
            }
            catch (err) {
                stderr.push(err?.stack ?? String(err));
            }
        };
        const handle = setInterval(wrappedHandler, timeout, ...args);
        activeIntervals.add(handle);
        return handle;
    };
    const trackedClearTimeout = (handle) => {
        if (handle) {
            activeTimeouts.delete(handle);
            clearTimeout(handle);
        }
    };
    const trackedClearInterval = (handle) => {
        if (handle) {
            activeIntervals.delete(handle);
            clearInterval(handle);
        }
    };
    const sandbox = {
        console: sandboxConsole,
        print: (v) => stdout.push(String(v)),
        setTimeout: trackedSetTimeout,
        setInterval: trackedSetInterval,
        clearTimeout: trackedClearTimeout,
        clearInterval: trackedClearInterval,
    };
    const context = createContext(sandbox, { codeGeneration: { strings: true, wasm: false } });
    let result;
    let timedOut = false;
    try {
        const script = new Script(code, { filename: "exec.js" });
        result = script.runInContext(context, { timeout: timeoutMs });
    }
    catch (err) {
        if (String(err?.message ?? err).includes("Script execution timed out")) {
            timedOut = true;
        }
        else {
            stderr.push(err?.stack ?? String(err));
        }
    }
    finally {
        cleanupTimers();
    }
    return { stdout, stderr, result, timedOut };
}
export function registerExec(server) {
    const handler = async (rawArgs, _extra) => {
        const { code, timeout_ms } = rawArgs;
        const result = runInSandbox(code, timeout_ms);
        const payload = {
            stdout: result.stdout,
            stderr: result.stderr,
            result: result.result,
            timedOut: result.timedOut,
        };
        return jsonResult(payload);
    };
    server.registerTool("exec.run", {
        title: "Run sandboxed JavaScript code",
        description: "Execute JavaScript code in a secure VM sandbox with a time limit. Captures print()/console.log output.",
        inputSchema: inputSchema,
    }, handler);
    // Back-compat alias
    server.registerTool("exec_run", { title: "Run sandboxed JavaScript code (alias)", description: "Alias for exec.run (back-compat)." }, handler);
}
