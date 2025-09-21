import { z } from "zod";
import { parseModel } from "../lib/dsl.js";
import { init } from "z3-solver";
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
    server.registerTool("constraint.solve", {
        title: "Constraint solver (Z3)",
        description: "Solve constraints using Z3. Input mini-DSL as JSON (variables, constraints, optional optimize).",
        inputSchema: { model_json: z.string().describe("JSON with {variables, constraints, optimize?}") },
    }, async ({ model_json }) => {
        let req;
        try {
            req = parseModel(model_json);
        }
        catch (e) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ error: e?.message || "Invalid model_json" }, null, 2),
                    },
                ],
            };
        }
        // Accept simple infix like "x > 5" by translating to SMT-LIB when possible
        const translatedConstraints = req.constraints.map((c) => {
            const m = c.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(==|!=|>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)\s*$/);
            if (!m)
                return c; // leave as-is
            const [, left, op, right] = m;
            const opMap = {
                ">": ">",
                "<": "<",
                ">=": ">=",
                "<=": "<=",
                "==": "=",
                "!=": "distinct",
            };
            const smt = opMap[op];
            if (!smt)
                return c;
            if (smt === "distinct")
                return `(distinct ${left} ${right})`;
            return `(${smt} ${left} ${right})`;
        });
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
            const assertions = translatedConstraints.map((c) => `(assert ${c})`);
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
                    return { content: [{ type: "text", text: JSON.stringify({ status }, null, 2) }] };
                }
                const model = opt.model();
                const entries = Object.entries(variableSymbols).map(([name, sym]) => [name, model.get(sym)]);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ status, model: serializeModel(entries) }, null, 2),
                        },
                    ],
                };
            }
            const solver = new Solver();
            if (baseScript.length > 0) {
                solver.fromString(baseScript);
            }
            const status = await solver.check();
            if (status !== "sat") {
                return { content: [{ type: "text", text: JSON.stringify({ status }, null, 2) }] };
            }
            const model = solver.model();
            const entries = Object.entries(variableSymbols).map(([name, sym]) => [name, model.get(sym)]);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ status, model: serializeModel(entries) }, null, 2),
                    },
                ],
            };
        }
        catch (err) {
            const message = err?.message ?? "Solver error";
            return { content: [{ type: "text", text: JSON.stringify({ error: message }, null, 2) }] };
        }
    });
}
