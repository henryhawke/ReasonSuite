import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { textResult, type ToolCallback } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";

const InputSchema = z.object({
    proposal: z.string(),
    rounds: z.number().int().min(1).max(5).default(2),
    focus: z.array(z.string()).default(["safety", "bias", "hallucination", "security", "privacy"]),
});

const inputSchema = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

const OutputSchema = z
    .object({
        rounds: z
            .array(
                z.object({
                    n: z.number().int(),
                    red: z.object({ attack: z.string() }),
                    blue: z.object({
                        defense: z.string(),
                        mitigations: z.array(z.string()).default([]),
                    }),
                })
            )
            .default([]),
        defects: z
            .array(
                z.object({
                    type: z.string(),
                    severity: z.enum(["low", "med", "high"]),
                    evidence: z.string(),
                })
            )
            .default([]),
        risk_matrix: z.object({
            low: z.array(z.string()).default([]),
            medium: z.array(z.string()).default([]),
            high: z.array(z.string()).default([]),
        }),
        final_guidance: z.array(z.string()).default([]),
    })
    .extend({ meta: ReasoningMetadataSchema.optional() });

export function registerRedBlue(server: McpServer): void {
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        // Validate and apply defaults to input arguments
        const validatedArgs = InputSchema.parse(rawArgs);
        const { proposal, rounds = 2, focus = ["safety", "bias", "hallucination", "security", "privacy"] } = validatedArgs;
        const prompt = `Conduct ${rounds} rounds of Red vs Blue adversarial analysis on:
${proposal}

Focus areas: ${focus.join(", ")}.

For each round:
1. Red Team: Identify the most critical attack vector or failure mode
2. Blue Team: Provide defense strategy and specific mitigations
3. Aggregate all defects found with severity and evidence
4. Create risk matrix categorizing issues as low/medium/high
5. Provide actionable final guidance

${STRICT_JSON_REMINDER}

JSON schema to emit:
{
  "rounds": [
    {
      "n": 1,
      "red": {"attack": "..."},
      "blue": {"defense": "...", "mitigations": ["..."]}
    }
  ],
  "defects": [
    {"type": "...", "severity": "low|med|high", "evidence": "..."}
  ],
  "risk_matrix": {
    "low": [],
    "medium": [],
    "high": []
  },
  "final_guidance": ["..."]
}
Return only valid JSON matching this exact schema.`;
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 2500,
            schema: OutputSchema,
            fallback: () => ({
                rounds: Array.from({ length: rounds || 2 }, (_, idx) => ({
                    n: idx + 1,
                    red: { attack: `Stress scenario ${idx + 1}: probe ${focus?.[idx % (focus?.length || 5)] ?? "failure"}` },
                    blue: {
                        defense: "Document mitigations and residual risks.",
                        mitigations: ["Add guardrails", "Strengthen monitoring"],
                    },
                })),
                defects: [
                    { type: "coverage_gap", severity: "med" as const, evidence: "Fallback analysis" },
                ],
                risk_matrix: { low: ["low impact issues"], medium: ["monitor residual risk"], high: [] },
                final_guidance: ["Close medium risks", "Schedule re-test after mitigations"],
            }),
        });
        return textResult(text);
    };

    const config = {
        title: "Red vs Blue critique",
        description:
            "Run N rounds of adversarial challenge/defense on a proposal or answer. Returns a transcript + defects + risk matrix.",
        inputSchema: inputSchema,
    };

    server.registerTool("redblue.challenge", config, handler);
    // Back-compat alias
    server.registerTool(
        "redblue_challenge",
        { title: config.title, description: "Alias for redblue.challenge (back-compat)." },
        handler
    );
}
