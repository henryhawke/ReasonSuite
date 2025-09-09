/* Simple smoke test that registers all tools on a fake server and executes them.
   Run: npx tsc -p tsconfig.json && node dist/smoke.js */
import { registerRouter } from "./router/router.js";
import { registerRazors } from "./tools/razors.js";
import { registerDialectic } from "./tools/dialectic.js";
import { registerSocratic } from "./tools/socratic.js";
import { registerAbductive } from "./tools/abductive.js";
import { registerSystems } from "./tools/systems.js";
import { registerRedBlue } from "./tools/redblue.js";
import { registerAnalogical } from "./tools/analogical.js";
import { registerConstraint } from "./tools/constraint.js";
class FakeServer {
    tools = new Map();
    prompts = new Map();
    resources = new Map();
    server = {
        createMessage: async ({ messages }) => {
            const text = messages?.[0]?.content?.text ?? "";
            const t = text.toLowerCase();
            let payload = { ok: true };
            if (t.includes("you are a planner")) {
                payload = {
                    steps: [
                        { mode: "socratic", why: "Scope", args: { depth: 2 } },
                        { mode: "abductive", why: "Generate options", args: { k: 3 } },
                    ],
                    notes: "smoke"
                };
            }
            else if (t.includes("dialectic")) {
                payload = {
                    thesis: { position: "pos", key_points: ["k1"] },
                    antithesis: { position: "neg", key_points: ["k2"] },
                    synthesis: { proposal: "syn", assumptions: ["a"], tradeoffs: ["t"], evidence_needed: ["e"] },
                    open_questions: ["q"]
                };
            }
            else if (t.includes("socratic question tree")) {
                payload = {
                    layers: [{ level: 1, questions: ["q1"] }],
                    assumptions_to_test: ["a"],
                    evidence_to_collect: ["e"],
                    next_actions: ["n"]
                };
            }
            else if (t.includes("abductive hypotheses")) {
                payload = {
                    hypotheses: [{ id: "H1", statement: "s", rationale: "r", scores: { prior_plausibility: 0.5, explanatory_power: 0.5, simplicity_penalty: 0.1, testability: 0.6, overall: 1.5 } }],
                    experiments_or_evidence: ["exp"],
                    notes: "smoke"
                };
            }
            else if (t.includes("causal loop diagram")) {
                payload = {
                    mermaid: "graph LR; A-->B;",
                    loops: [{ type: "reinforcing", nodes: ["A", "B"] }],
                    leverage_points: ["rules"],
                    stock_flow_hints: [{ stock: "S", inflows: ["I"], outflows: ["O"] }],
                    assumptions: ["a"],
                    risks: ["r"]
                };
            }
            else if (t.includes("red (attack) vs blue")) {
                payload = {
                    rounds: [{ n: 1, red: { attack: "x" }, blue: { defense: "y", mitigations: ["m"] } }],
                    defects: [{ type: "t", severity: "low", evidence: "e" }],
                    risk_matrix: { low: [], medium: [], high: [] },
                    final_guidance: ["g"]
                };
            }
            else if (t.includes("structural analogy")) {
                payload = {
                    mapping: [{ source: "s", target: "t", justification: "j" }],
                    shared_relations: ["rel"],
                    mismatches: ["mm"],
                    transferable_insights: ["ti"],
                    failure_modes: ["fm"]
                };
            }
            else if (t.includes("candidates json")) {
                payload = {
                    results: [{ id: "H1", keep_or_drop: "keep", reasons: ["simple"], risk_notes: "low" }],
                    shortlist: ["H1"],
                    notes: "smoke"
                };
            }
            return { content: { type: "text", text: JSON.stringify(payload) } };
        }
    };
    registerTool(name, _meta, handler) { this.tools.set(name, handler); }
    registerPrompt(name, _meta, builder) { this.prompts.set(name, builder); }
    registerResource(_name, _uri, _meta, _handler) { }
}
async function run() {
    const server = new FakeServer();
    // Register all tools
    registerRouter(server);
    registerRazors(server);
    registerDialectic(server);
    registerSocratic(server);
    registerAbductive(server);
    registerSystems(server);
    registerRedBlue(server);
    registerAnalogical(server);
    registerConstraint(server);
    async function call(name, args, validate) {
        const h = server.tools.get(name);
        if (!h)
            throw new Error(`Tool not registered: ${name}`);
        const res = await h(args);
        const text = Array.isArray(res?.content) ? res.content[0]?.text ?? res.content[0]?.contents?.[0]?.text : res?.content?.text;
        const obj = JSON.parse(text);
        validate(obj);
        console.log(`OK: ${name}`);
    }
    await call("reasoning.router.plan", { task: "test", maxSteps: 3 }, (o) => { if (!Array.isArray(o.steps))
        throw new Error("router"); });
    await call("dialectic.tas", { claim: "C", audience: "general" }, (o) => { if (!o.thesis || !o.antithesis || !o.synthesis)
        throw new Error("dialectic"); });
    await call("socratic.inquire", { topic: "T", depth: 2 }, (o) => { if (!Array.isArray(o.layers))
        throw new Error("socratic"); });
    await call("abductive.hypothesize", { observations: "O", k: 2, apply_razors: ["MDL"] }, (o) => { if (!Array.isArray(o.hypotheses))
        throw new Error("abductive"); });
    await call("razors.apply", { candidates_json: "[{\"id\":\"H1\"}]", razors: ["MDL"] }, (o) => { if (!Array.isArray(o.results))
        throw new Error("razors"); });
    await call("systems.map", { variables: ["a", "b"], context: "ctx" }, (o) => { if (!o.mermaid)
        throw new Error("systems"); });
    await call("redblue.challenge", { proposal: "P", rounds: 1, focus: ["safety"] }, (o) => { if (!Array.isArray(o.rounds))
        throw new Error("redblue"); });
    await call("analogical.map", { source_domain: "S", target_problem: "T" }, (o) => { if (!Array.isArray(o.mapping))
        throw new Error("analogical"); });
    await call("constraint.solve", { model_json: JSON.stringify({ variables: [{ name: "x", type: "Int" }], constraints: ["(>= x 0)"] }) }, (o) => { if (!o.status)
        throw new Error("constraint"); });
    console.log("All tools passed smoke test.");
}
run().catch((e) => { console.error(e); process.exit(1); });
