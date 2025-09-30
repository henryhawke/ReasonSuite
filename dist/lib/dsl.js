import { z } from "zod";
const nameRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;
const modelSchema = z.object({
    variables: z
        .array(z.object({
        name: z
            .string()
            .min(1, "Variable name required")
            .regex(nameRegex, "Variable names must be alphanumeric/underscore and start with a letter or underscore"),
        type: z.enum(["Int", "Real", "Bool"]),
    }))
        .default([]),
    constraints: z.array(z.string()).default([]),
    optimize: z
        .object({
        objective: z.string().min(1, "objective cannot be empty"),
        sense: z.enum(["min", "max"]),
    })
        .nullish(),
});
export function parseModel(json) {
    let parsed;
    try {
        parsed = JSON.parse(json);
    }
    catch (e) {
        const error = e;
        throw new Error(`Invalid JSON format. ${error.message}. ` +
            `Expected format: {"variables": [{"name": "x", "type": "Int"}], "constraints": ["(>= x 0)"]}`);
    }
    let result;
    try {
        result = modelSchema.parse(parsed);
    }
    catch (e) {
        const zodError = e.errors?.[0];
        if (zodError) {
            const path = zodError.path.join('.');
            throw new Error(`Validation error at '${path}': ${zodError.message}. ` +
                `Check that variables have 'name' and 'type' fields, and constraints are strings.`);
        }
        throw new Error(`Model validation failed: ${e.message}`);
    }
    const seen = new Set();
    for (const v of result.variables) {
        if (seen.has(v.name)) {
            throw new Error(`Duplicate variable name '${v.name}'. Each variable must have a unique name. ` +
                `Current variables: ${result.variables.map(v => v.name).join(', ')}`);
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
