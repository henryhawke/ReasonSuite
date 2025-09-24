import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";
const ArgsSchema = z.object({
    query: z.string(),
    allow_citations: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerSelfExplainPrompts(server) {
    const callback = (({ query, allow_citations }, _extra) => {
        const citeFlag = allow_citations ?? "true";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Produce a transparent self-explanation.\n\nQuery or answer under review:\n${query}\nCitations allowed now? ${citeFlag}\n\nSteps:\n1. Draft a numbered rationale that walks through the reasoning at a high level.\n2. Provide evidence entries linking each claim to a citation or state "would retrieve" if citations are disallowed.\n3. List self_critique items highlighting weaknesses, missing data, or assumptions.\n4. Offer a concise revision that incorporates the critiques.\n\nReturn strict JSON only:\n{"rationale":["..."],"evidence":[{"claim":"...","source":"..."}],"self_critique":["..."],"revision":"..."}\nNo extra commentary outside the JSON payload.`,
                    },
                },
            ],
        };
    });
    server.registerPrompt("reasoning.self_explain", {
        title: "Self-Explanation",
        description: "Rationale + evidence + critique + revision",
        argsSchema: argsShape,
    }, callback);
}
