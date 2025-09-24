import { z } from "zod";
import { textResult } from "../lib/mcp.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";
const InputSchema = z.object({
    claim: z.string(),
    context: z.string().optional(),
    audience: z.string().default("general"),
});
const inputSchema = InputSchema;
const OutputSchema = z
    .object({
    thesis: z.object({ position: z.string(), key_points: z.array(z.string()).default([]) }),
    antithesis: z.object({ position: z.string(), key_points: z.array(z.string()).default([]) }),
    synthesis: z.object({
        proposal: z.string(),
        assumptions: z.array(z.string()).default([]),
        tradeoffs: z.array(z.string()).default([]),
        evidence_needed: z.array(z.string()).default([]),
    }),
    open_questions: z.array(z.string()).default([]),
})
    .extend({ meta: ReasoningMetadataSchema.optional() });
export function registerDialectic(server) {
    const handler = async (rawArgs, _extra) => {
        const { claim, context, audience } = rawArgs;
        const prompt = `Use a dialectical frame.
Claim: ${claim}
Context: ${context ?? ""}
Audience: ${audience}

Return strict JSON only:
{
 "thesis": {"position": "...", "key_points": ["..."]},
 "antithesis": {"position": "...", "key_points": ["..."]},
"synthesis": {"proposal": "...", "assumptions": ["..."], "tradeoffs": ["..."], "evidence_needed": ["..."]},
"open_questions": ["..."]
}`;
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 700,
            schema: OutputSchema,
            fallback: () => ({
                thesis: {
                    position: `Clarify and defend the core of "${claim}"`,
                    key_points: ["state assumptions", "highlight supporting evidence"],
                },
                antithesis: {
                    position: "Interrogate weaknesses or counter-cases",
                    key_points: ["surface missing evidence", "describe risks to the audience"],
                },
                synthesis: {
                    proposal: "Blend validated parts of claim with mitigations",
                    assumptions: [context ? "context details hold" : "background facts verified"],
                    tradeoffs: ["balance confidence vs. uncertainty"],
                    evidence_needed: ["collect targeted data or expert review"],
                },
                open_questions: ["Which stakeholder perspectives are under-represented?"],
            }),
        });
        return textResult(text);
    };
    const config = {
        title: "Dialectic (Thesis–Antithesis–Synthesis)",
        description: "Given a claim, produce thesis, antithesis, and synthesis with evidence requests.",
        inputSchema,
    };
    server.registerTool("dialectic.tas", config, handler);
    server.registerTool("dialectic_tas", config, handler);
}
