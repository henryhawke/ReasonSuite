import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ReasoningMetadataSchema, sampleStructuredJson } from "../lib/structured.js";

const InputSchema = z.object({
    source_domain: z.string(),
    target_problem: z.string(),
    constraints: z.string().optional(),
});

const inputSchema = InputSchema as any;

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
    const handler = async ({ source_domain, target_problem, constraints }: any) => {
        const prompt = `Build a structural analogy from SOURCE to TARGET.

SOURCE: ${source_domain}
TARGET: ${target_problem}
CONSTRAINTS: ${constraints ?? ""}

JSON only:
{
 "mapping":[{"source":"...","target":"...","justification":"..."}],
 "shared_relations":["..."],
 "mismatches":["..."],
 "transferable_insights":["..."],
 "failure_modes":["..."]
}`;
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
        return { content: [{ type: "text", text }] };
    };

    const config = {
        title: "Analogical mapping",
        description:
            "Map structure from a source domain to a target problem; identify correspondences, constraints, and transfer risks.",
        inputSchema,
    };

    server.registerTool("analogical.map", config, handler);
    server.registerTool("analogical_map", config, handler);
    server.registerTool("analogical-map", config, handler);
}
