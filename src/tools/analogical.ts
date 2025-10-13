import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult, textResult, type ToolCallback } from "../lib/mcp.js";
import { buildStructuredPrompt } from "../lib/prompt.js";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";

const InputSchema = z.object({
    source_domain: z.string(),
    target_problem: z.string(),
    constraints: z.string().optional(),
});

const inputSchema = InputSchema.shape;

type InputArgs = z.output<typeof InputSchema>;
type InputShape = typeof inputSchema;

const OutputSchema = z
    .object({
        mapping: z
            .array(
                z.object({
                    source: z.string(),
                    target: z.string(),
                    justification: z.string(),
                })
            )
            .default([]),
        shared_relations: z.array(z.string()).default([]),
        mismatches: z.array(z.string()).default([]),
        transferable_insights: z.array(z.string()).default([]),
        failure_modes: z.array(z.string()).default([]),
    })
    .extend({ meta: ReasoningMetadataSchema.optional() });

export function registerAnalogical(server: McpServer): void {
    const handler: ToolCallback<any> = async (rawArgs, _extra) => {
        const parsed = InputSchema.safeParse(rawArgs);
        if (!parsed.success) {
            return jsonResult({ error: "Invalid arguments for analogical.map", issues: parsed.error.issues });
        }
        const { source_domain, target_problem, constraints } = parsed.data;
        const prompt = buildStructuredPrompt({
            mode: "Analogical",
            objective: "Transfer structure from source domain to target problem while flagging mismatches.",
            inputs: { source_domain, target_problem, constraints },
            steps: [
                "Extract core actors, relationships, dynamics in source.",
                "Map each relevant source element to a target counterpart with justification.",
                "List structural relations that transfer cleanly and highlight mismatches.",
                "Summarise transferable_insights and failure_modes to monitor.",
            ],
            schema:
                '{"mapping":[{"source":"","target":"","justification":""}],"shared_relations":[],"mismatches":[],"transferable_insights":[],"failure_modes":[]}',
        });
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 420,
            schema: OutputSchema,
            fallback: () => ({
                mapping: [
                    {
                        source: source_domain,
                        target: target_problem,
                        justification: "Match core structure (actors, resources, feedback).",
                    },
                ],
                shared_relations: ["Identify analogous causal chain", "Compare resource constraints"],
                mismatches: ["Context-specific regulations", "Scale differences"],
                transferable_insights: ["Borrow proven intervention pattern", "Adopt metric from source domain"],
                failure_modes: ["Surface-level analogy misses hidden variable", "Target lacks enabling infrastructure"],
            }),
        });
        return textResult(text);
    };

    const config = {
        title: "Analogical mapping",
        description:
            "Map structure from a source domain to a target problem; identify correspondences, constraints, and transfer risks.",
        inputSchema: inputSchema,
    };

    server.registerTool("analogical.map", config, handler);
    // Back-compat alias
    server.registerTool(
        "analogical_map",
        { title: config.title, description: "Alias for analogical.map (back-compat)." },
        handler
    );
}
