import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseModel, ModelRequest } from "../lib/dsl.js";
import { init } from "z3-solver";

export function registerConstraint(server: McpServer): void {
    server.registerTool(
        "constraint.solve",
        {
            title: "Constraint solver (Z3)",
            description:
                "Solve constraints using Z3. Input mini-DSL as JSON (variables, constraints, optional optimize).",
            inputSchema: { model_json: z.string().describe("JSON with {variables, constraints, optimize?}") },
        },
        async ({ model_json }) => {
            const { Context } = await init();
            const Z: any = new (Context as any)("main");
            let req: ModelRequest;

            try {
                req = parseModel(model_json);
            } catch (e: any) {
                return { content: [{ type: "text", text: JSON.stringify({ error: e?.message || "Invalid model_json" }, null, 2) }] };
            }

            const decls: Record<string, any> = {};
            for (const v of req.variables) {
                decls[v.name] = v.type === "Int" ? Z.Int.const(v.name) : v.type === "Real" ? Z.Real.const(v.name) : Z.Bool.const(v.name);
            }

            const s = new Z.Solver();
            for (const c of req.constraints) {
                try {
                    const f = Z.parseSMTLIB2(`(assert ${c})`, [], [], Object.values(decls));
                    s.add(f);
                } catch {
                    return { content: [{ type: "text", text: JSON.stringify({ error: `Bad constraint: ${c}` }, null, 2) }] };
                }
            }

            if (req.optimize) {
                const o = new Z.Optimize();
                o.add(s.assertions());
                const term = Z.parseSMTLIB2(req.optimize.objective, [], [], Object.values(decls));
                if (req.optimize.sense === "min") o.minimize(term);
                else o.maximize(term);
                const r = o.check();
                if (r !== "sat") return { content: [{ type: "text", text: JSON.stringify({ status: r }, null, 2) }] };
                const m = o.model();
                const model: Record<string, any> = {};
                for (const [name, sym] of Object.entries(decls)) model[name] = m.get(sym)?.toString();
                return { content: [{ type: "text", text: JSON.stringify({ status: r, model }, null, 2) }] };
            } else {
                const r = s.check();
                if (r !== "sat") return { content: [{ type: "text", text: JSON.stringify({ status: r }, null, 2) }] };
                const m = s.model();
                const model: Record<string, any> = {};
                for (const [name, sym] of Object.entries(decls)) model[name] = m.get(sym)?.toString();
                return { content: [{ type: "text", text: JSON.stringify({ status: r, model }, null, 2) }] };
            }
        }
    );
}


