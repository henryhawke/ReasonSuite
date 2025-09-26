import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { textResult, type ToolCallback } from "../lib/mcp.js";
import { STRICT_JSON_REMINDER } from "../lib/prompt.js";
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
        const { source_domain, target_problem, constraints } = rawArgs as InputArgs;
        const prompt = `Build a structural analogy from SOURCE to TARGET.

SOURCE: ${source_domain}
TARGET: ${target_problem}
CONSTRAINTS: ${constraints ?? ""}

Deliberation steps:
1. Identify the core actors, relationships, and dynamics in the source domain.
2. Map each relevant source element to the best target counterpart with justification.
3. List structural relations that transfer cleanly and flag mismatches or missing components.
4. Summarise transferable_insights and failure_modes the target should monitor.

${STRICT_JSON_REMINDER}

JSON schema to emit:
{
 "mapping":[{"source":"...","target":"...","justification":"..."}],
 "shared_relations":["..."],
 "mismatches":["..."],
 "transferable_insights":["..."],
 "failure_modes":["..."]
}
Return only that JSON object.`;
        const { text } = await sampleStructuredJson({
            server,
            prompt,
            maxTokens: 900,
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
        // inputSchema,
    };

    server.registerTool("analogical.map", config, handler);
    // Back-compat alias
    server.registerTool(
        "analogical_map",
        { title: config.title, description: "Alias for analogical.map (back-compat)." },
        handler
    );
}
