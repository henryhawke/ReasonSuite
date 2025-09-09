import { z } from "zod";
export function registerConstraintPrompts(server) {
    server.registerPrompt("constraint.solve", {
        title: "Constraint Solve",
        description: "Z3 mini-DSL JSON input",
        argsSchema: { model_json: z.string() },
    }, ({ model_json }) => ({
        messages: [
            { role: "user", content: { type: "text", text: `Solve constraints using Z3.\nInput JSON: ${model_json}\nReturn JSON {"status":"sat|unsat|unknown","model":{...}}` } },
        ],
    }));
}
