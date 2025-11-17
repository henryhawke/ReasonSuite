import { z } from "zod";
import { jsonResult } from "../lib/mcp.js";
import { normalizeToolInput } from "../lib/args.js";
import { parseModel } from "../lib/dsl.js";
import { init } from "z3-solver";
import { computeArgumentHash, getCachedSolverResult, cacheSolverResult, } from "../lib/verification.js";
import { withBudget } from "../lib/budget.js";
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
const SIMPLE_COMPARISON = /^([A-Za-z_][A-Za-z0-9_]*)\s*(<=|>=|==|=|!=|>|<)\s*([-+]?[A-Za-z0-9_\.]+)$/;
const Z3_INIT_TIMEOUT_MS = 10_000;
let z3ModulePromise = null;
async function withTimeout(promise, ms, message) {
    return await new Promise((resolve, reject) => {
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
async function loadZ3Module() {
    if (!z3ModulePromise) {
        z3ModulePromise = init();
    }
    return withTimeout(z3ModulePromise, Z3_INIT_TIMEOUT_MS, "Z3 initialization timeout");
}
async function createZ3Context() {
    const z3Module = await loadZ3Module();
    return z3Module.Context("reason-suite-constraint");
}
function toSmtConstraint(raw) {
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
function serializeModel(entries) {
    const model = {};
    for (const [name, value] of entries) {
        if (value !== undefined && value !== null) {
            model[name] = value.toString();
        }
    }
    return model;
}
export function registerConstraint(server) {
    const handler = async (rawArgs, _extra) => {
        const solveStartTime = Date.now();
        // Validate and apply defaults to input arguments
        const parsed = InputSchema.safeParse(normalizeToolInput(rawArgs));
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for constraint.solve", issues: parsed.error.issues });
        }
        const { model_json } = parsed.data;
        // Compute hash for caching
        const argsHash = computeArgumentHash({ model_json });
        // Check cache first
        const cached = getCachedSolverResult(argsHash);
        if (cached) {
            return jsonResult({
                ...cached.result,
                _verification: {
                    argumentHash: argsHash,
                    fromCache: true,
                    cacheHits: cached.hits,
                    proofArtifacts: cached.proofArtifacts,
                },
            });
        }
        let req;
        try {
            // Handle both string and object inputs from MCP with early validation
            if (typeof model_json === 'string') {
                req = parseModel(model_json);
            }
            else if (model_json && typeof model_json === 'object') {
                // Direct object input - validate with Zod and convert to ModelRequest format
                const validated = ModelSchema.parse(model_json);
                req = {
                    variables: validated.variables,
                    constraints: validated.constraints.map(c => c.trim()).filter(c => c.length > 0),
                    optimize: validated.optimize || null
                };
            }
            else {
                throw new Error("model_json must be a JSON string or object");
            }
            // Early validation: check for empty or invalid models
            if (req.variables.length === 0 && req.constraints.length === 0 && !req.optimize) {
                return jsonResult({ error: "Model must contain at least one variable, constraint, or optimization objective" });
            }
        }
        catch (e) {
            return jsonResult({ error: e?.message ?? "Invalid model_json" });
        }
        try {
            // Execute solver with budget enforcement (15s timeout)
            const solveResult = await withBudget(async () => {
                const ctx = await createZ3Context();
                const { Solver, Optimize, Int, Real, Bool } = ctx;
                const declarations = [];
                const variableSymbols = {};
                for (const variable of req.variables) {
                    declarations.push(`(declare-const ${variable.name} ${variable.type})`);
                    if (variable.type === "Int") {
                        variableSymbols[variable.name] = Int.const(variable.name);
                    }
                    else if (variable.type === "Real") {
                        variableSymbols[variable.name] = Real.const(variable.name);
                    }
                    else {
                        variableSymbols[variable.name] = Bool.const(variable.name);
                    }
                }
                const normalizedConstraints = req.constraints.map(toSmtConstraint);
                const assertions = normalizedConstraints.map((c) => `(assert ${c})`);
                const baseScript = [...declarations, ...assertions].join("\n");
                return { ctx, Solver, Optimize, Int, Real, Bool, variableSymbols, baseScript, normalizedConstraints };
            }, { maxTimeMs: 15000 });
            const { ctx, Solver, Optimize, variableSymbols, baseScript, normalizedConstraints } = solveResult;
            if (req.optimize && req.optimize.objective) {
                const opt = new Optimize();
                const sense = req.optimize.sense === "min" ? "minimize" : "maximize";
                const script = [baseScript, `(${sense} ${req.optimize.objective})`]
                    .filter((section) => section.length > 0)
                    .join("\n");
                if (script.length > 0) {
                    opt.fromString(script);
                }
                const checkStatus = await opt.check();
                const solveTimeMs = Date.now() - solveStartTime;
                if (checkStatus !== "sat") {
                    const result = {
                        status: checkStatus,
                        _verification: {
                            argumentHash: argsHash,
                            fromCache: false,
                            proofArtifacts: {
                                statistics: { solve_time_ms: solveTimeMs },
                                smtScript: script,
                            },
                        },
                    };
                    cacheSolverResult(argsHash, result, result._verification.proofArtifacts);
                    return jsonResult(result);
                }
                const model = opt.model();
                const entries = Object.entries(variableSymbols).map(([name, sym]) => [name, model.get(sym)]);
                const serializedModel = serializeModel(entries);
                // Build proof artifacts
                const proofArtifacts = {
                    models: [serializedModel],
                    statistics: {
                        solve_time_ms: solveTimeMs,
                    },
                    smtScript: script,
                    causalAnalysis: {
                        critical_constraints: normalizedConstraints.slice(0, 5), // Top constraints
                        variable_dependencies: Object.keys(variableSymbols).reduce((acc, v) => {
                            acc[v] = req.constraints.filter(c => c.includes(v)).slice(0, 3);
                            return acc;
                        }, {}),
                    },
                };
                const result = {
                    status: checkStatus,
                    model: serializedModel,
                    _verification: {
                        argumentHash: argsHash,
                        fromCache: false,
                        proofArtifacts,
                        verifiable: true,
                    },
                };
                cacheSolverResult(argsHash, result, proofArtifacts);
                return jsonResult(result);
            }
            const solver = new Solver();
            if (baseScript.length > 0) {
                solver.fromString(baseScript);
            }
            const checkStatus = await solver.check();
            const solveTimeMs = Date.now() - solveStartTime;
            if (checkStatus !== "sat") {
                const result = {
                    status: checkStatus,
                    _verification: {
                        argumentHash: argsHash,
                        fromCache: false,
                        proofArtifacts: {
                            statistics: { solve_time_ms: solveTimeMs },
                            smtScript: baseScript,
                        },
                    },
                };
                cacheSolverResult(argsHash, result, result._verification.proofArtifacts);
                return jsonResult(result);
            }
            const model = solver.model();
            const entries = Object.entries(variableSymbols).map(([name, sym]) => [name, model.get(sym)]);
            const serializedModel = serializeModel(entries);
            // Build proof artifacts
            const proofArtifacts = {
                models: [serializedModel],
                statistics: {
                    solve_time_ms: solveTimeMs,
                },
                smtScript: baseScript,
                causalAnalysis: {
                    critical_constraints: normalizedConstraints.slice(0, 5), // Top constraints
                    variable_dependencies: Object.keys(variableSymbols).reduce((acc, v) => {
                        acc[v] = req.constraints.filter(c => c.includes(v)).slice(0, 3);
                        return acc;
                    }, {}),
                },
            };
            const result = {
                status: checkStatus,
                model: serializedModel,
                _verification: {
                    argumentHash: argsHash,
                    fromCache: false,
                    proofArtifacts,
                    verifiable: true,
                },
            };
            cacheSolverResult(argsHash, result, proofArtifacts);
            return jsonResult(result);
        }
        catch (err) {
            const message = err?.message ?? "Solver error";
            return jsonResult({ error: message });
        }
    };
    server.registerTool("constraint.solve", {
        title: "Constraint solver (Z3)",
        description: "Solve constraints using Z3. Input mini-DSL as JSON (variables, constraints, optional optimize).",
        inputSchema: inputSchema,
    }, handler);
    // Back-compat alias
    server.registerTool("constraint_solve", { title: "Constraint solver (alias)", description: "Alias for constraint.solve (back-compat)." }, handler);
}
