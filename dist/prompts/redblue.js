import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_REMINDER } from "../lib/prompt.js";
const ArgsSchema = z.object({
    proposal: z.string(),
    rounds: z.string().optional(),
    focus: z.string().optional(),
});
const argsShape = definePromptArgsShape(ArgsSchema.shape);
export function registerRedBluePrompts(server) {
    const callback = ((extra) => {
        const { proposal, rounds, focus } = extra?.params ?? {};
        const roundCount = rounds ?? "2";
        const focusList = focus ?? "safety,bias,hallucination,security,privacy";
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Run a structured red team vs blue team exercise.\n\nProposal under review:\n${proposal}\n\nNumber of rounds: ${roundCount}\nFocus areas: ${focusList}\n\nDeliberation steps:\n1. For each round capture red.attack (most concerning failure mode) then blue.defense (mitigations + mitigations list).\n2. Aggregate defects with type, severity (low|med|high), and supporting evidence.\n3. Populate a risk_matrix listing low/medium/high risks.\n4. Provide final_guidance actions or sign-off criteria.\n${STRICT_JSON_REMINDER}\n\nJSON schema to emit:\n{
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
    });
    server.registerPrompt("redblue.challenge", {
        title: "Red/Blue Challenge",
        description: "Adversarial critique with risk matrix",
        argsSchema: argsShape,
    }, callback);
}
