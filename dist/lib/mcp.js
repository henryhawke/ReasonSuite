export function textContent(text) {
    return { type: "text", text };
}
export function textResult(text) {
    return { content: [textContent(text)] };
}
export function jsonResult(value, { pretty = false } = {}) {
    if (typeof value === "string") {
        return textResult(value);
    }
    try {
        const spacing = pretty ? 2 : undefined;
        return textResult(JSON.stringify(value, null, spacing));
    }
    catch (error) {
        return textResult(String(value));
    }
}
