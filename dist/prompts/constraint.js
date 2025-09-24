import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_REMINDER } from "../lib/prompt.js";
const ArgsSchema = z.object({
    model_json: z.string(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerConstraintPrompts(server) {
    const callback = ((extra) => {
        const { model_json } = extra?.params ?? {};
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `You are a constraint reasoning assistant backed by Z3.\n\nConstraint specification (JSON):\n${model_json}\n\nDeliberation steps:\n1. Parse variables, constraints, and any optimise directive from the JSON (validate structure).\n2. If the model is invalid, return strictly {"error":"why the input failed"}.\n3. Otherwise solve or optimise with Z3 and capture resulting assignments.\n4. Make sure model is {} when status is unsat/unknown and include optimum values when available.\n${STRICT_JSON_REMINDER}\n\nJSON schema to emit:\n{"status":"sat|unsat|unknown","model":{"var":"value"}} (or {"error":"..."})\nReturn only that JSON object.`,
                    },
                },
            ],
        };
    });
    server.registerPrompt("constraint.solve", {
        title: "Constraint Solve",
        description: "Z3 mini-DSL JSON input",
        argsSchema: argsShape,
    }, callback);
}
