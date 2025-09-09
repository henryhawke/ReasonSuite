export type VarDecl = { name: string; type: "Int" | "Real" | "Bool" };
export type Constraint = string;

export type ModelRequest = {
    variables: VarDecl[];
    constraints: Constraint[];
    optimize?: { objective: string; sense: "min" | "max" } | null;
};

export function parseModel(json: string): ModelRequest {
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.variables) || !Array.isArray(parsed.constraints)) {
        throw new Error("Missing fields");
    }
    return parsed;
}


