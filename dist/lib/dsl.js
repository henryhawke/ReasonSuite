export function parseModel(json) {
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.variables) || !Array.isArray(parsed.constraints)) {
        throw new Error("Missing fields");
    }
    return parsed;
}
