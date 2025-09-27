import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { textResult, type ToolCallback } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";

const InputSchema = z.object({
    claim: z.string(),
    context: z.string().optional(),
    audience: z.string().default("general"),
});

const inputSchema = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

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

export function registerDialectic(server: McpServer): void {
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        const { claim, context, audience } = rawArgs as InputArgs;
        const prompt = `Use a dialectical frame.
Claim: ${claim}
Context: ${context ?? ""}
Audience: ${audience}

Deliberation steps:
1. Summarise the strongest thesis supporting the claim with concrete key_points.
2. Develop the strongest antithesis highlighting counterarguments, missing evidence, or risks.
3. Craft a synthesis that reconciles or updates the claim, including proposal, assumptions, tradeoffs, and evidence_needed.
4. List remaining open_questions that must be addressed.

${STRICT_JSON_REMINDER}

JSON schema to emit:
{
 "thesis": {"position": "...", "key_points": ["..."]},
 "antithesis": {"position": "...", "key_points": ["..."]},
"synthesis": {"proposal": "...", "assumptions": ["..."], "tradeoffs": ["..."], "evidence_needed": ["..."]},
"open_questions": ["..."]
}
Return only that JSON object.`;
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
        inputSchema: inputSchema,
    };

    server.registerTool("dialectic.tas", config, handler);
    // Back-compat alias
    server.registerTool(
        "dialectic_tas",
        { title: config.title, description: "Alias for dialectic.tas (back-compat)." },
        handler
    );
}
