import { z } from "zod";
import { jsonResult } from "../lib/mcp.js";
import { parseModel } from "../lib/dsl.js";
import { init } from "z3-solver";
const InputSchema = z.object({
    model_json: z.string().describe("JSON with {variables, constraints, optimize?}"),
});
const inputSchema = InputSchema;
const SIMPLE_COMPARISON = /^([A-Za-z_][A-Za-z0-9_]*)\s*(<=|>=|==|=|!=|>|<)\s*([-+]?[A-Za-z0-9_\.]+)$/;
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
        const { model_json } = rawArgs;
        let req;
        try {
            req = parseModel(model_json);
        }
        catch (e) {
            return jsonResult({ error: e?.message ?? "Invalid model_json" });
        }
        try {
            const { Context } = await init();
            const ctx = Context("reason-suite-constraint");
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
            if (req.optimize && req.optimize.objective) {
                const opt = new Optimize();
                const sense = req.optimize.sense === "min" ? "minimize" : "maximize";
                const script = [baseScript, `(${sense} ${req.optimize.objective})`]
                    .filter((section) => section.length > 0)
                    .join("\n");
                if (script.length > 0) {
                    opt.fromString(script);
                }
                const status = await opt.check();
                if (status !== "sat") {
                    return jsonResult({ status });
                }
                const model = opt.model();
                const entries = Object.entries(variableSymbols).map(([name, sym]) => [name, model.get(sym)]);
                return jsonResult({ status, model: serializeModel(entries) });
            }
            const solver = new Solver();
            if (baseScript.length > 0) {
                solver.fromString(baseScript);
            }
            const status = await solver.check();
            if (status !== "sat") {
                return jsonResult({ status });
            }
            const model = solver.model();
            const entries = Object.entries(variableSymbols).map(([name, sym]) => [name, model.get(sym)]);
            return jsonResult({ status, model: serializeModel(entries) });
        }
        catch (err) {
            const message = err?.message ?? "Solver error";
            return jsonResult({ error: message });
        }
    };
    server.registerTool("constraint.solve", {
        title: "Constraint solver (Z3)",
        description: "Solve constraints using Z3. Input mini-DSL as JSON (variables, constraints, optional optimize).",
        inputSchema,
    }, handler);
    server.registerTool("constraint_solve", {
        title: "Constraint solver (Z3)",
        description: "Solve constraints using Z3. Input mini-DSL as JSON (variables, constraints, optional optimize).",
        inputSchema,
    }, handler);
}
