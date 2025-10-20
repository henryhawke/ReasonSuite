import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult, type ToolCallback } from "../lib/mcp.js";
import { normalizeToolInput } from "../lib/args.js";
import { parseModel } from "../lib/dsl.js";
import { init } from "z3-solver";

type SerializedModel = Record<string, string>;

type SolverEntry = [string, any];

const ModelSchema = z.object({
    variables: z.array(z.object({
        name: z.string(),
        type: z.enum(["Int", "Real", "Bool"])
    })).default([]),
    constraints: z.array(z.string()).default([]),
    optimize: z.object({
        objective: z.string(),
        sense: z.enum(["min", "max"])
    }).optional()
});

const InputSchema = z.object({
    model_json: z.union([
        z.string().describe("JSON string with {variables, constraints, optimize?}"),
        ModelSchema.describe("Model object with {variables, constraints, optimize?}")
    ]).describe("Model definition as JSON string or object"),
});

const inputSchema = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

const SIMPLE_COMPARISON =
    /^([A-Za-z_][A-Za-z0-9_]*)\s*(<=|>=|==|=|!=|>|<)\s*([-+]?[A-Za-z0-9_\.]+)$/;

const Z3_INIT_TIMEOUT_MS = 10_000;
let z3ModulePromise: Promise<any> | null = null;

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return await new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(message)), ms);
        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

async function loadZ3Module(): Promise<any> {
    if (!z3ModulePromise) {
        z3ModulePromise = init();
    }
    return withTimeout(z3ModulePromise, Z3_INIT_TIMEOUT_MS, "Z3 initialization timeout");
}

async function createZ3Context() {
    const z3Module = await loadZ3Module();
    return z3Module.Context("reason-suite-constraint");
}

function toSmtConstraint(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
        return trimmed;
    }
    if (trimmed.startsWith("(")) {
        return trimmed;
    }
    const match = SIMPLE_COMPARISON.exec(trimmed);
    if (!match) {
        return trimmed;
    }
    const [, variable, op, rhs] = match;
    switch (op) {
        case "!=":
            return `(distinct ${variable} ${rhs})`;
        case "==":
        case "=":
            return `(= ${variable} ${rhs})`;
        case ">":
        case "<":
        case ">=":
        case "<=":
            return `(${op} ${variable} ${rhs})`;
        default:
            return trimmed;
    }
}

function serializeModel(entries: SolverEntry[]): SerializedModel {
    const model: SerializedModel = {};
    for (const [name, value] of entries) {
        if (value !== undefined && value !== null) {
            model[name] = value.toString();
        }
    }
    return model;
}

export function registerConstraint(server: McpServer): void {
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        // Validate and apply defaults to input arguments
        const parsed = InputSchema.safeParse(normalizeToolInput(rawArgs));
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for constraint.solve", issues: parsed.error.issues });
        }
        const { model_json } = parsed.data;

        let req;
        try {
            // Handle both string and object inputs from MCP with early validation
            if (typeof model_json === 'string') {
                req = parseModel(model_json);
            } else if (model_json && typeof model_json === 'object') {
                // Direct object input - validate with Zod and convert to ModelRequest format
                const validated = ModelSchema.parse(model_json);
                req = {
                    variables: validated.variables,
                    constraints: validated.constraints.map(c => c.trim()).filter(c => c.length > 0),
                    optimize: validated.optimize || null
                };
            } else {
                throw new Error("model_json must be a JSON string or object");
            }

            // Early validation: check for empty or invalid models
            if (req.variables.length === 0 && req.constraints.length === 0 && !req.optimize) {
                return jsonResult({ error: "Model must contain at least one variable, constraint, or optimization objective" });
            }

        } catch (e: unknown) {
            return jsonResult({ error: (e as Error)?.message ?? "Invalid model_json" });
        }

        try {
            const ctx = await createZ3Context();
            const { Solver, Optimize, Int, Real, Bool } = ctx;

            const declarations: string[] = [];
            const variableSymbols: Record<string, any> = {};

            for (const variable of req.variables) {
                declarations.push(`(declare-const ${variable.name} ${variable.type})`);
                if (variable.type === "Int") {
                    variableSymbols[variable.name] = Int.const(variable.name);
                } else if (variable.type === "Real") {
                    variableSymbols[variable.name] = Real.const(variable.name);
                } else {
                    variableSymbols[variable.name] = Bool.const(variable.name);
                }
            }

            const normalizedConstraints = req.constraints.map(toSmtConstraint);
            const assertions = normalizedConstraints.map((c) => `(assert ${c})`);
            const baseScript = [...declarations, ...assertions].join("\n");

            if (req.optimize && req.optimize.objective) {
                const opt = new Optimize();
                const sense = req.optimize.sense === "min" ? "minimize" : "maximize";
                const script = [baseScript, `(${sense} ${req.optimize.objective})`]
                    .filter((section) => section.length > 0)
                    .join("\n");

                if (script.length > 0) {
                    opt.fromString(script);
                }

                // Add timeout for optimization solving
                const checkPromise = opt.check();
                const checkTimeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Optimization solving timeout")), 15000)
                );

                const status = await Promise.race([checkPromise, checkTimeoutPromise]);
                if (status !== "sat") {
                    return jsonResult({ status });
                }

                const model = opt.model();
                const entries = Object.entries(variableSymbols).map(([name, sym]) => [name, model.get(sym)] as SolverEntry);
                return jsonResult({ status, model: serializeModel(entries) });
            }

            const solver = new Solver();
            if (baseScript.length > 0) {
                solver.fromString(baseScript);
            }

            // Add timeout for constraint solving
            const checkPromise = solver.check();
            const checkTimeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Constraint solving timeout")), 15000)
            );

            const status = await Promise.race([checkPromise, checkTimeoutPromise]);
            if (status !== "sat") {
                return jsonResult({ status });
            }

            const model = solver.model();
            const entries = Object.entries(variableSymbols).map(([name, sym]) => [name, model.get(sym)] as SolverEntry);
            return jsonResult({ status, model: serializeModel(entries) });
        } catch (err: unknown) {
            const message = (err as Error)?.message ?? "Solver error";
            return jsonResult({ error: message });
        }
    };

    server.registerTool(
        "constraint.solve",
        {
            title: "Constraint solver (Z3)",
            description: "Solve constraints using Z3. Input mini-DSL as JSON (variables, constraints, optional optimize).",
            inputSchema: inputSchema,
        },
        handler
    );
    // Back-compat alias
    server.registerTool(
        "constraint_solve",
        { title: "Constraint solver (alias)", description: "Alias for constraint.solve (back-compat)." },
        handler
    );
}
