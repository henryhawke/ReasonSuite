import { z } from "zod";
import { Script, createContext } from "node:vm";
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
        // Provide a minimal set of globals; no access to require or process
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
    server.registerTool("exec.run", {
        title: "Run sandboxed JavaScript code",
        description: "Execute JavaScript code in a secure VM sandbox with a time limit. Captures print()/console.log output.",
        inputSchema: {
            code: z
                .string()
                .describe("JavaScript source to run. If the user provided fenced code, pass the content between the fences."),
            timeout_ms: z.number().int().min(10).max(10_000).default(1500),
        },
        annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
    }, async ({ code, timeout_ms }) => {
        const result = runInSandbox(code, timeout_ms);
        const payload = {
            stdout: result.stdout,
            stderr: result.stderr,
            result: result.result,
            timedOut: result.timedOut,
        };
        return { content: [{ type: "text", text: JSON.stringify(payload) }] };
    });
}
