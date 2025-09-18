import { z } from "zod";

export type VarDecl = { name: string; type: "Int" | "Real" | "Bool" };
export type Constraint = string;

export type ModelRequest = {
    variables: VarDecl[];
    constraints: Constraint[];
    optimize?: { objective: string; sense: "min" | "max" } | null;
};

const nameRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;

const modelSchema = z.object({
    variables: z
        .array(
            z.object({
                name: z
                    .string()
                    .min(1, "Variable name required")
                    .regex(nameRegex, "Variable names must be alphanumeric/underscore and start with a letter or underscore"),
                type: z.enum(["Int", "Real", "Bool"]),
            })
        )
        .default([]),
    constraints: z.array(z.string()).default([]),
    optimize: z
        .object({
            objective: z.string().min(1, "objective cannot be empty"),
            sense: z.enum(["min", "max"]),
        })
        .nullish(),
});

export function parseModel(json: string): ModelRequest {
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error("model_json is not valid JSON");
    }

    const result = modelSchema.parse(parsed);

    const seen = new Set<string>();
    for (const v of result.variables) {
        if (seen.has(v.name)) {
            throw new Error(`Duplicate variable name: ${v.name}`);
        }
        seen.add(v.name);
    }

    const constraints = result.constraints.map((c) => c.trim()).filter((c) => c.length > 0);

    return {
        variables: result.variables,
        constraints,
        optimize: result.optimize ?? null,
    };
}
