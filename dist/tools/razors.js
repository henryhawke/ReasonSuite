import { z } from "zod";
export function registerRazors(server) {
    server.registerTool("razors.apply", {
        title: "Apply reasoning razors",
        description: "Given candidate explanations, apply Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, Popper falsifiability to produce keep/drop recommendations.",
        inputSchema: {
            candidates_json: z.string().describe("JSON array or object of candidates"),
            razors: z
                .array(z.string())
                .default(["MDL", "BayesianOccam", "Sagan", "Hitchens", "Hanlon", "Popper"]),
        },
    }, async ({ candidates_json, razors }) => {
        const prompt = `Candidates JSON:\n${candidates_json}
Razors: ${razors.join(", ")}

For each candidate produce JSON objects:
{"id":"...","keep_or_drop":"keep|drop|revise","reasons":["..."],"risk_notes":"..."}

Return strict JSON only:
{ "results": [...], "shortlist": ["ids..."], "notes": "..." }`;
        const resp = await server.server.createMessage({
            messages: [{ role: "user", content: { type: "text", text: prompt } }],
            maxTokens: 700,
        });
        return { content: [{ type: "text", text: resp.content.type === "text" ? resp.content.text : "{}" }] };
    });
}
