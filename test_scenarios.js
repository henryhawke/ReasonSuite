// Scenario-driven tests for ReasonSuite tools (uses compiled dist/*)

import { registerRouter } from "./dist/router/router.js";
import { registerRazors } from "./dist/tools/razors.js";
import { registerDialectic } from "./dist/tools/dialectic.js";
import { registerSocratic } from "./dist/tools/socratic.js";
import { registerAbductive } from "./dist/tools/abductive.js";
import { registerSystems } from "./dist/tools/systems.js";
import { registerRedBlue } from "./dist/tools/redblue.js";
import { registerAnalogical } from "./dist/tools/analogical.js";
import { registerConstraint } from "./dist/tools/constraint.js";
import { registerScientific } from "./dist/tools/scientific.js";
import { registerSelfExplain } from "./dist/tools/self_explain.js";
import { registerDivergent } from "./dist/tools/divergent.js";
import { registerExec } from "./dist/tools/exec.js";
import { registerSelector } from "./dist/tools/selector.js";
import { registerReasoning } from "./dist/tools/reasoning.js";

class DeterministicLLMServer {
  tools = new Map();
  server = {
    createMessage: async ({ messages }) => {
      const text = messages?.[0]?.content?.text ?? "";
      const t = text.toLowerCase();
      let payload = { ok: true };
      if (t.includes("you are a planner")) {
        payload = {
          steps: [
            { mode: "socratic", why: "clarify", args: { depth: 2 } },
            { mode: "abductive", why: "hypotheses", args: { k: 3 } },
            {
              mode: "razors.apply",
              why: "prune",
              args: { razors: ["MDL", "Popper"] },
            },
          ],
          notes: "scenario",
        };
      } else if (t.includes("socratic question tree")) {
        payload = {
          layers: [
            { level: 1, questions: ["Define success", "List constraints"] },
            { level: 2, questions: ["Evidence to confirm?"] },
          ],
          assumptions_to_test: ["hidden deps"],
          evidence_to_collect: ["metrics"],
          next_actions: ["decide next tool"],
        };
      } else if (t.includes("use a dialectical frame")) {
        payload = {
          thesis: { position: "Ship now", key_points: ["market timing"] },
          antithesis: { position: "Delay", key_points: ["stability"] },
          synthesis: {
            proposal: "Partial rollout",
            assumptions: ["critical risks mitigated"],
            tradeoffs: ["speed vs quality"],
            evidence_needed: ["beta feedback"],
          },
          open_questions: ["what SLA?"],
        };
      } else if (t.includes("observations:")) {
        payload = {
          hypotheses: [
            {
              id: "H1",
              statement: "Regression in cache",
              rationale: "matches timing",
              scores: {
                prior_plausibility: 0.5,
                explanatory_power: 0.6,
                simplicity_penalty: 0.2,
                testability: 0.6,
                overall: 1.5,
              },
            },
          ],
          experiments_or_evidence: ["compare cache hit rate"],
          notes: "scenario",
        };
      } else if (t.includes("candidates json:")) {
        payload = {
          results: [
            {
              id: "H1",
              keep_or_drop: "keep",
              reasons: ["simple"],
              risk_notes: "low",
            },
          ],
          shortlist: ["H1"],
          notes: "scenario",
        };
      } else if (t.includes("build a structural analogy")) {
        payload = {
          mapping: [
            { source: "postal", target: "queue", justification: "batching" },
          ],
          shared_relations: ["flow"],
          mismatches: ["real-time"],
          transferable_insights: ["prioritize critical"],
          failure_modes: ["overfit analogy"],
        };
      } else if (t.includes("causal loop diagram")) {
        payload = {
          mermaid:
            "graph LR; Demand-->Load; Load-->Latency; Latency-.-|neg|Demand;",
          loops: [
            { type: "reinforcing", nodes: ["Demand", "Load"] },
            { type: "balancing", nodes: ["Latency", "Demand"] },
          ],
          leverage_points: ["buffering"],
          stock_flow_hints: [
            {
              stock: "Backlog",
              inflows: ["Requests"],
              outflows: ["Processing"],
            },
          ],
          assumptions: ["linear approx"],
          risks: ["hidden delays"],
        };
      } else if (t.includes("red (attack) vs blue")) {
        payload = {
          rounds: [
            {
              n: 1,
              red: { attack: "bypass auth" },
              blue: { defense: "gateway", mitigations: ["WAF"] },
            },
            {
              n: 2,
              red: { attack: "data exfil" },
              blue: { defense: "DLP", mitigations: ["masking"] },
            },
          ],
          defects: [{ type: "exposure", severity: "med", evidence: "logs" }],
          risk_matrix: { low: ["non-critical"], medium: ["monitor"], high: [] },
          final_guidance: ["gate rollout"],
        };
      } else if (t.includes("scientific analytic framework")) {
        payload = {
          decomposition: ["define goal", "list constraints"],
          hypotheses: ["H1", "H2"],
          tests: ["unit", "z3"],
          verification: {
            strategy: "run tests",
            popper_falsification: "find counterexample",
          },
          answer: "scenario",
        };
      } else if (t.includes("transparent self-explanation")) {
        payload = {
          rationale: ["analyze", "trace"],
          evidence: [{ claim: "ref", source: "doc://constraint-dsl.md" }],
          self_critique: ["assumes stable context"],
          revision: "scenario",
        };
      } else if (t.includes("divergent then convergent")) {
        payload = {
          divergent: ["idea A", "idea B", "idea C"],
          scores: [
            {
              id: 1,
              by: { novelty: 0.8, consistency: 0.6, relevance: 0.9 },
              notes: "ok",
            },
          ],
          winner: { id: 1, why: "best overall" },
          synthesis: "combine A with mitigations",
        };
      }
      return { content: { type: "text", text: JSON.stringify(payload) } };
    },
  };
  registerTool(name, _meta, handler) {
    this.tools.set(name, handler);
  }
}

function parseResult(res) {
  const c = Array.isArray(res?.content) ? res.content[0] : res?.content;
  const text = c?.text ?? c?.contents?.[0]?.text ?? "{}";
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

function assertHas(obj, key) {
  if (!(key in (obj || {}))) throw new Error(`Missing key: ${key}`);
}

async function run() {
  const server = new DeterministicLLMServer();
  registerRouter(server);
  registerRazors(server);
  registerDialectic(server);
  registerSocratic(server);
  registerAbductive(server);
  registerSystems(server);
  registerRedBlue(server);
  registerAnalogical(server);
  registerConstraint(server);
  registerScientific(server);
  registerSelfExplain(server);
  registerDivergent(server);
  registerExec(server);
  registerSelector(server);
  registerReasoning(server);

  const scenarios = [];
  const call = async (tool, args, requiredKeys = []) => {
    const h = server.tools.get(tool);
    if (!h) throw new Error(`Tool not registered: ${tool}`);
    const res = await h(args);
    const json = parseResult(res);
    requiredKeys.forEach((k) => assertHas(json, k));
    scenarios.push({ tool, ok: true });
    console.log(`OK: ${tool}`);
  };

  // Router & Selector
  await call(
    "reasoning.router.plan",
    {
      task: "Migrate service",
      context: "optimize cost <= 500; risks",
      maxSteps: 4,
    },
    ["steps"]
  );
  await call(
    "reasoning.selector",
    { request: "Root cause analysis", context: "timeouts" },
    ["primary_mode"]
  );

  // Dialectic
  await call(
    "dialectic.tas",
    { claim: "Ship now vs later", audience: "exec" },
    ["thesis", "antithesis", "synthesis"]
  );

  // Socratic
  await call("socratic.inquire", { topic: "Deprecate endpoint", depth: 3 }, [
    "layers",
    "next_actions",
  ]);

  // Abductive
  await call(
    "abductive.hypothesize",
    {
      observations: "error up after deploy",
      k: 3,
      apply_razors: ["MDL", "Popper"],
    },
    ["hypotheses"]
  );

  // Razors
  await call(
    "razors.apply",
    {
      candidates_json: JSON.stringify([{ id: "H1" }, { id: "H2" }]),
      razors: ["MDL", "Sagan"],
    },
    ["results", "shortlist"]
  );

  // Analogical
  await call(
    "analogical.map",
    { source_domain: "Postal", target_problem: "Queue" },
    ["mapping"]
  );

  // Systems
  await call("systems.map", { variables: ["Demand", "Load"], context: "web" }, [
    "mermaid",
    "loops",
  ]);

  // Red/Blue
  await call(
    "redblue.challenge",
    { proposal: "Expose admin API", rounds: 2, focus: ["security", "privacy"] },
    ["rounds", "risk_matrix"]
  );

  // Scientific
  await call(
    "reasoning.scientific",
    { goal: "Pick index", context: "point lookups", allow_tools: true },
    ["decomposition", "tests"]
  );

  // Self Explain
  await call(
    "reasoning.self_explain",
    { query: "Explain MDL", allow_citations: true },
    ["rationale", "revision"]
  );

  // Divergent/Convergent
  await call(
    "reasoning.divergent_convergent",
    { prompt: "Improve onboarding", k: 3, criteria: ["impact", "effort"] },
    ["divergent", "winner"]
  );

  // Exec
  await call("exec.run", { code: "console.log('ok'); 1+1;", timeout_ms: 500 }, [
    "stdout",
  ]);

  // Constraint (sat, optimize)
  await call(
    "constraint.solve",
    {
      model_json: JSON.stringify({
        variables: [{ name: "x", type: "Int" }],
        constraints: ["(>= x 0)", "(<= x 3)"],
      }),
    },
    ["status", "model"]
  );
  await call(
    "constraint.solve",
    {
      model_json: JSON.stringify({
        variables: [{ name: "x", type: "Int" }],
        constraints: ["(>= x 0)", "(<= x 5)"],
        optimize: { objective: "x", sense: "max" },
      }),
    },
    ["status", "model"]
  );

  // Unified interface (spot-check a few modes)
  await call(
    "reasoning.run",
    { mode: "plan", task: "Capacity planning", maxSteps: 3 },
    ["steps"]
  );
  await call(
    "reasoning.run",
    { mode: "socratic", topic: "Retire service", depth: 2 },
    ["layers"]
  );
  await call(
    "reasoning.run",
    {
      mode: "constraint",
      model_json: JSON.stringify({
        variables: [{ name: "x", type: "Int" }],
        constraints: ["(> x 0)", "(< x 10)"],
      }),
    },
    ["status", "model"]
  );

  console.log("\nAll scenario tests passed.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

