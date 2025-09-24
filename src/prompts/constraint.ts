import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";

const ArgsSchema = z.object({
    model_json: z.string(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerConstraintPrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { model_json } = extra?.params ?? {};
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Solve constraints using Z3.\nInput JSON: ${model_json}\nReturn JSON {"status":"sat|unsat|unknown","model":{...}}`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "constraint.solve",
        {
            title: "Constraint Solve",
            description: "Z3 mini-DSL JSON input",
            argsSchema: argsShape as any,
        },
        callback
    );
}
