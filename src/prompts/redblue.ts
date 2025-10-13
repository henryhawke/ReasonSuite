import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_COMPACT } from "../lib/prompt.js";

const ArgsSchema = z.object({
    proposal: z.string(),
    rounds: z.string().optional(),
    focus: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerRedBluePrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { proposal, rounds, focus } = extra?.params ?? {};
        const roundCount = rounds ?? "2";
        const focusList = focus ?? "safety,bias,hallucination,security,privacy";
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Run a structured red team vs blue team exercise.\n\nProposal under review:\n${proposal}\n\nNumber of rounds: ${roundCount}\nFocus areas: ${focusList}\n\nDeliberation steps:\n1. For each round capture red.attack (most concerning failure mode) then blue.defense (mitigations + mitigations list).\n2. Aggregate defects with type, severity (low|med|high), and supporting evidence.\n3. Populate a risk_matrix listing low/medium/high risks.\n4. Provide final_guidance actions or sign-off criteria.\n${STRICT_JSON_COMPACT}\n\nJSON schema to emit:\n{
  "rounds": [
    {
      "n": 1,
      "red": {"attack": "..."},
      "blue": {"defense": "...", "mitigations": ["..."]}
    }
  ],
  "defects": [
    {"type": "...", "severity": "low", "evidence": "..."}
  ],
  "risk_matrix": {
    "low": ["..."],
    "medium": ["..."],
    "high": ["..."]
  },
  "final_guidance": ["..."]
}
Return only valid JSON matching this exact schema.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "redblue.challenge",
        {
            title: "Red/Blue Challenge",
            description: "Adversarial critique with risk matrix",
            argsSchema: argsShape as any,
        },
        callback
    );
}
