import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseModel } from "../lib/dsl.js";
import { init } from "z3-solver";

type SerializedModel = Record<string, string>;

type SolverEntry = [string, any];

const InputSchema = z.object({
    model_json: z.string().describe("JSON with {variables, constraints, optimize?}"),
});

const inputSchema = InputSchema as any;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

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
    const handler = async ({ model_json }: any) => {
        let req;
        try {
            req = parseModel(model_json);
        } catch (e: unknown) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ error: (e as Error)?.message ?? "Invalid model_json" }, null, 2),
                    },
                ],
            };
        }

        try {
            const { Context } = await init();
            const ctx = Context("reason-suite-constraint");
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

            const assertions = req.constraints.map((c) => `(assert ${c})`);
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
                const entries = Object.entries(variableSymbols).map(([name, sym]) => [name, model.get(sym)] as SolverEntry);
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
            const entries = Object.entries(variableSymbols).map(([name, sym]) => [name, model.get(sym)] as SolverEntry);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ status, model: serializeModel(entries) }, null, 2),
                    },
                ],
            };
        } catch (err: unknown) {
            const message = (err as Error)?.message ?? "Solver error";
            return { content: [{ type: "text", text: JSON.stringify({ error: message }, null, 2) }] };
        }
    };

    server.registerTool(
        "constraint.solve",
        {
            title: "Constraint solver (Z3)",
            description: "Solve constraints using Z3. Input mini-DSL as JSON (variables, constraints, optional optimize).",
            inputSchema,
        },
        handler
    );
    server.registerTool(
        "constraint_solve",
        {
            title: "Constraint solver (Z3)",
            description: "Solve constraints using Z3. Input mini-DSL as JSON (variables, constraints, optional optimize).",
            inputSchema,
        },
        handler
    );
}
