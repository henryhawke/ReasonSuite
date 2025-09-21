import { z } from "zod";
export function registerAbductive(server) {
    const config = {
        title: "Abductive hypotheses",
        description: "Generate k candidate hypotheses and rank by plausibility, explanatory power, simplicity (MDL proxy), and testability.",
        inputSchema: {
            observations: z.string(),
            k: z.number().int().min(2).max(10).default(4),
            apply_razors: z.array(z.string()).default(["MDL", "Hitchens", "Sagan", "Popper"]),
        },
    };
    const handler = async ({ observations, k, apply_razors }) => {
        const prompt = `Observations:\n${observations}

Generate ${k} abductive hypotheses. Score each on:
- prior_plausibility (0-1)
- explanatory_power (0-1)
- simplicity_penalty (0-1)
- testability (0-1)
- overall_score = prior_plausibility + explanatory_power + testability - simplicity_penalty

Apply razors: ${apply_razors.join(", ")}.
Return strict JSON only:
{
 "hypotheses": [
  {"id":"H1","statement":"...","rationale":"...", "scores":{"prior_plausibility":0.6,"explanatory_power":0.7,"simplicity_penalty":0.2,"testability":0.6,"overall":1.7}}
 ],
 "experiments_or_evidence": ["test1"],
 "notes": "..."
}`;
        const resp = await server.server.createMessage({
            messages: [{ role: "user", content: { type: "text", text: prompt } }],
            maxTokens: 900,
        });
        return { content: [{ type: "text", text: resp.content.type === "text" ? resp.content.text : "{}" }] };
    };
    server.registerTool("abductive.hypothesize", config, handler);
    server.registerTool("abductive_hypothesize", config, handler);
}
