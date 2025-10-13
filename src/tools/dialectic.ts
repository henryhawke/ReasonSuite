import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult, textResult, type ToolCallback } from "../lib/mcp.js";
import { buildStructuredPrompt } from "../lib/prompt.js";
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
        const parsed = InputSchema.safeParse(rawArgs);
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for dialectic.tas", issues: parsed.error.issues });
        }
        const { claim, context, audience } = parsed.data;
        const prompt = buildStructuredPrompt({
            mode: "Dialectic",
            objective: "Map the thesis, antithesis, and synthesis for the claim and audience.",
            inputs: { claim, context, audience },
            steps: [
                "Thesis: strongest support plus concrete key_points.",
                "Antithesis: strongest rebuttal, gaps, or risks.",
                "Synthesis: reconciled proposal with assumptions, tradeoffs, evidence_needed.",
                "Open_questions: remaining uncertainties to resolve.",
            ],
            schema:
                '{"thesis":{"position":"","key_points":[]},"antithesis":{"position":"","key_points":[]},"synthesis":{"proposal":"","assumptions":[],"tradeoffs":[],"evidence_needed":[]},"open_questions":[]}',
        });
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 360,
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
