import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
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
                        text: `You are a constraint reasoning assistant backed by Z3.\n\nConstraint specification (JSON):\n${model_json}\n\nInstructions:\n1. Parse variables, constraints, and any optimize directive from the JSON.\n2. If the model is invalid, respond with strict JSON {"error":"why the input failed"}.\n3. Otherwise solve or optimise with Z3.\n4. Return strict JSON only in the form {"status":"sat|unsat|unknown","model":{ "var":"value", ... }}.\n   - When status is unsat or unknown, model may be {}.\n   - When optimising, include the optimum objective value if available.\nDo not output extra prose or code fences.`,
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
