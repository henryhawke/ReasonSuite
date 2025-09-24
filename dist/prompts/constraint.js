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
                        text: `Solve constraints using Z3.\nInput JSON: ${model_json}\nReturn JSON {"status":"sat|unsat|unknown","model":{...}}`,
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
