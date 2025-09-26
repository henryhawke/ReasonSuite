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
    const sandboxConsole = {
        log: (...args) => stdout.push(args.map(String).join(" ")),
        error: (...args) => stderr.push(args.map(String).join(" ")),
        warn: (...args) => stderr.push(args.map(String).join(" ")),
    };
    const sandbox = {
        console: sandboxConsole,
        print: (v) => stdout.push(String(v)),
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
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
        // inputSchema,
    }, handler);
    // Back-compat alias
    server.registerTool("exec_run", { title: "Run sandboxed JavaScript code (alias)", description: "Alias for exec.run (back-compat)." }, handler);
}
