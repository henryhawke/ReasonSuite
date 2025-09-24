import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape } from "../lib/prompt.js";

const ArgsSchema = z.object({
    observations: z.string(),
    k: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerAbductivePrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { observations, k } = extra?.params ?? {};
        const target = k ?? "4";
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `You are ReasonSuite's abductive reasoning engine.\n\nObservations:\n${observations}\n\nFollow this procedure:\n1. Extract the most telling clues or anomalies from the observations.\n2. Generate exactly ${target} labelled hypotheses (H1, H2, ...) that could explain the evidence.\n3. For each hypothesis provide a concise statement, a short rationale citing the clues, and scores between 0 and 1 for prior_plausibility, explanatory_power, simplicity_penalty (penalize complexity), and testability.\n4. Compute overall = prior_plausibility + explanatory_power + testability - simplicity_penalty (round to two decimals).\n5. List discriminating experiments_or_evidence.\n6. Add any residual caveats in notes.\n\nReturn strict JSON only in the following format:\n{"hypotheses":[{"id":"H1","statement":"...","rationale":"...","scores":{"prior_plausibility":0.0,"explanatory_power":0.0,"simplicity_penalty":0.0,"testability":0.0,"overall":0.0}}],"experiments_or_evidence":["..."],"notes":"..."}\nDo not include commentary outside the JSON block.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "abductive.hypotheses",
        {
            title: "Abductive Hypotheses",
            description: "k-best explanations with razors",
            argsSchema: argsShape as any,
        },
        callback
    );
}
