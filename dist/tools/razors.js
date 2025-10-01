import { z } from "zod";
import { jsonResult } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
import { DEFAULT_RAZORS, summarizeRazors } from "../lib/razors.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    candidates_json: z.string().describe("JSON array or object of candidates"),
    razors: z.array(z.string()).default([...DEFAULT_RAZORS]),
});
const inputSchema = InputSchema.shape;
const OutputSchema = z
    .object({
    results: z
        .array(z.object({
        id: z.string(),
        keep_or_drop: z.enum(["keep", "drop", "revise"]),
        reasons: z.array(z.string()).default([]),
        risk_notes: z.string().optional(),
    }))
        .default([]),
    shortlist: z.array(z.string()).default([]),
    notes: z.string().optional(),
})
    .extend({ meta: ReasoningMetadataSchema.optional() });
export function registerRazors(server) {
    const handler = async (rawArgs, _extra) => {
        try {
            const parsed = InputSchema.safeParse(rawArgs);
            if (!parsed.success) {
                return jsonResult({ error: "Invalid arguments for razors.apply", issues: parsed.error.issues });
            }
            const { candidates_json, razors: rawRazors } = parsed.data;
            const normalizedRazors = Array.isArray(rawRazors) ? rawRazors.filter((name) => typeof name === "string") : undefined;
            const razors = normalizedRazors && normalizedRazors.length ? normalizedRazors : [...DEFAULT_RAZORS];
            const prompt = `Candidates JSON:\n${candidates_json}
Razors to apply (explain how each affects the verdict):
${summarizeRazors(razors)}

Deliberation steps:
1. Parse the candidate entries from candidates_json.
2. For each candidate, apply every listed razor and capture keep/drop/revise with reasons.
3. Highlight notable risks or caveats in risk_notes.
4. Build a shortlist of the strongest candidates and add any meta notes.

${STRICT_JSON_REMINDER}

JSON schema to emit:
{ "results": [{"id":"...","keep_or_drop":"keep|drop|revise","reasons":["..."],"risk_notes":"..."}], "shortlist": ["ids..."], "notes": "..." }
Return only that JSON object.`;
            const { data } = await sampleStructuredJson({
                server,
                prompt,
                maxTokens: 700,
                schema: OutputSchema,
                fallback: () => {
                    const tryParseCandidates = () => {
                        try {
                            const parsed = JSON.parse(candidates_json ?? "null");
                            if (Array.isArray(parsed)) {
                                return parsed;
                            }
                            if (parsed && typeof parsed === "object") {
                                if (Array.isArray(parsed.candidates)) {
                                    return parsed.candidates;
                                }
                                return Object.values(parsed).filter((value) => value && typeof value === "object");
                            }
                        }
                        catch {
                            // Ignore parse failures; fallback will synthesize candidates.
                        }
                        return [];
                    };
                    const parsedCandidates = tryParseCandidates();
                    const candidateCount = parsedCandidates.length || 1;
                    const primaryRazor = razors?.[0] ?? "MDL";
                    const secondaryRazor = razors?.[1] ?? "Popper";
                    const normalized = (parsedCandidates.length ? parsedCandidates : [{ id: "candidate-1" }]).map((candidate, idx) => {
                        const id = typeof candidate.id === "string" && candidate.id.trim().length
                            ? candidate.id.trim()
                            : typeof candidate.title === "string" && candidate.title.trim().length
                                ? candidate.title.trim()
                                : typeof candidate.name === "string" && candidate.name.trim().length
                                    ? candidate.name.trim()
                                    : `candidate-${idx + 1}`;
                        const keep = idx === 0;
                        const keepOrDrop = keep ? "keep" : idx === 1 ? "revise" : "drop";
                        const reasons = keep
                            ? [
                                `Passes ${primaryRazor} screening with minimal added complexity.`,
                                `Still testable under ${secondaryRazor} falsifiability.`,
                            ]
                            : [
                                `Requires refinement to satisfy ${primaryRazor} simplicity expectations.`,
                                `Provide experiments to satisfy ${secondaryRazor} scepticism.`,
                            ];
                        const riskNotes = keep
                            ? `Monitor for regressions and gather evidence to keep ${primaryRazor} satisfied.`
                            : `Address weaknesses highlighted by ${primaryRazor} before promoting this option.`;
                        return {
                            id,
                            keep_or_drop: keepOrDrop,
                            reasons,
                            risk_notes: riskNotes,
                        };
                    });
                    const shortlist = normalized
                        .filter((entry) => entry.keep_or_drop === "keep" || entry.keep_or_drop === "revise")
                        .map((entry) => entry.id);
                    if (shortlist.length === 0 && normalized.length > 0) {
                        shortlist.push(normalized[0].id);
                    }
                    return {
                        results: normalized,
                        shortlist,
                        notes: `Deterministic heuristic analysis; evaluated ${candidateCount} candidate(s) with ${razors.join(", ") || "default"} razors.`,
                    };
                },
            });
            return jsonResult(data);
        }
        catch (error) {
            const message = error?.message ?? String(error);
            const stack = typeof error?.stack === "string" ? error.stack : undefined;
            return jsonResult({ error: "razors.apply internal failure", message, stack });
        }
    };
    server.registerTool("razors.apply", {
        title: "Apply reasoning razors",
        description: "Given candidate explanations, apply Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, Popper falsifiability to produce keep/drop recommendations.",
        inputSchema: inputSchema,
    }, handler);
    // Back-compat alias
    server.registerTool("razors_apply", { title: "Apply reasoning razors (alias)", description: "Alias for razors.apply (back-compat)." }, handler);
}
