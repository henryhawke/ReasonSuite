import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { textResult, type ToolCallback } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
import { DEFAULT_RAZORS, summarizeRazors } from "../lib/razors.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";

const InputSchema = z.object({
    candidates_json: z.string().describe("JSON array or object of candidates"),
    razors: z.array(z.string()).default([...DEFAULT_RAZORS]),
});

const inputSchema = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

const OutputSchema = z
    .object({
        results: z
            .array(
                z.object({
                    id: z.string(),
                    keep_or_drop: z.enum(["keep", "drop", "revise"]),
                    reasons: z.array(z.string()).default([]),
                    risk_notes: z.string().optional(),
                })
            )
            .default([]),
        shortlist: z.array(z.string()).default([]),
        notes: z.string().optional(),
    })
    .extend({ meta: ReasoningMetadataSchema.optional() });

export function registerRazors(server: McpServer): void {
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        const { candidates_json, razors } = rawArgs as InputArgs;
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
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 700,
            schema: OutputSchema,
            fallback: () => ({
                results: [
                    {
                        id: "candidate-1",
                        keep_or_drop: "keep" as const,
                        reasons: ["Simplest explanation consistent with MDL", "Survives Popper falsifiability"],
                        risk_notes: "Monitor for new contradictory evidence",
                    },
                ],
                shortlist: ["candidate-1"],
                notes: "Deterministic fallback applied; validate candidates_json structure.",
            }),
        });
        return textResult(text);
    };

    server.registerTool(
        "razors.apply",
        {
            title: "Apply reasoning razors",
            description:
                "Given candidate explanations, apply Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, Popper falsifiability to produce keep/drop recommendations.",
            inputSchema: inputSchema,
        },
        handler
    );
    // Back-compat alias
    server.registerTool(
        "razors_apply",
        { title: "Apply reasoning razors (alias)", description: "Alias for razors.apply (back-compat)." },
        handler
    );
}
