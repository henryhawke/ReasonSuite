export function textContent(text) {
    return { type: "text", text };
}
export function textResult(text) {
    return { content: [textContent(text)] };
}
export function jsonResult(value) {
    if (typeof value === "string") {
        return textResult(value);
    }
    try {
        return textResult(JSON.stringify(value, null, 2));
    }
    catch (error) {
        return textResult(String(value));
    }
}
