// Comprehensive tool exercise for ReasonSuite (uses compiled dist/*)

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

class TestHarnessServer {
  tools = new Map();
  prompts = new Map();
  resources = new Map();
  server = {
    // Provide deterministic JSON so tools that sample can parse without network
    createMessage: async ({ messages }) => {
      const text = messages?.[0]?.content?.text ?? "";
      const t = text.toLowerCase();
      let payload = { ok: true };
      if (t.includes("you are a planner")) {
        payload = {
          steps: [
            { mode: "socratic", why: "scope", args: { depth: 2 } },
            { mode: "abductive", why: "generate", args: { k: 3 } },
            {
              mode: "razors.apply",
              why: "prune",
              args: { razors: ["MDL", "Popper"] },
            },
          ],
          notes: "test",
        };
      } else if (t.includes("socratic question tree")) {
        payload = {
          layers: [
            { level: 1, questions: ["What is success?", "What constraints?"] },
            { level: 2, questions: ["What evidence confirms?"] },
          ],
          assumptions_to_test: ["hidden premises"],
          evidence_to_collect: ["metrics"],
          next_actions: ["summarize"],
        };
      } else if (t.includes("use a dialectical frame")) {
        payload = {
          thesis: {
            position: "defend core",
            key_points: ["assumptions", "evidence"],
          },
          antithesis: {
            position: "question weaknesses",
            key_points: ["risks", "gaps"],
          },
          synthesis: {
            proposal: "blend validated parts",
            assumptions: ["context holds"],
            tradeoffs: ["speed vs quality"],
            evidence_needed: ["user study"],
          },
          open_questions: ["what stakeholders?"],
        };
      } else if (t.includes("observations:")) {
        payload = {
          hypotheses: [
            {
              id: "H1",
              statement: "simple cause",
              rationale: "fits data",
              scores: {
                prior_plausibility: 0.5,
                explanatory_power: 0.6,
                simplicity_penalty: 0.2,
                testability: 0.6,
                overall: 1.5,
              },
            },
          ],
          experiments_or_evidence: ["log check"],
          notes: "test",
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
          notes: "test",
        };
      } else if (t.includes("build a structural analogy")) {
        payload = {
          mapping: [
            { source: "S", target: "T", justification: "structure match" },
          ],
          shared_relations: ["flow"],
          mismatches: ["scale"],
          transferable_insights: ["reuse pattern"],
          failure_modes: ["superficial analogy"],
        };
      } else if (t.includes("causal loop diagram")) {
        payload = {
          mermaid: "graph LR; A-->B; B-->C; C-->A;",
          loops: [
            { type: "reinforcing", nodes: ["A", "B", "C"] },
            { type: "balancing", nodes: ["C", "D"] },
          ],
          leverage_points: ["rules"],
          stock_flow_hints: [{ stock: "S", inflows: ["I"], outflows: ["O"] }],
          assumptions: ["simplified"],
          risks: ["hidden delays"],
        };
      } else if (t.includes("red (attack) vs blue")) {
        payload = {
          rounds: [
            {
              n: 1,
              red: { attack: "stress" },
              blue: { defense: "mitigate", mitigations: ["guardrail"] },
            },
          ],
          defects: [{ type: "gap", severity: "low", evidence: "mock" }],
          risk_matrix: { low: ["a"], medium: [], high: [] },
          final_guidance: ["close gaps"],
        };
      } else if (t.includes("scientific analytic framework")) {
        payload = {
          decomposition: ["understand", "list constraints"],
          hypotheses: ["H1", "H2"],
          tests: ["unit", "z3"],
          verification: {
            strategy: "execute tests",
            popper_falsification: "seek counterexample",
          },
          answer: "test",
        };
      } else if (t.includes("transparent self-explanation")) {
        payload = {
          rationale: ["analyze", "gather evidence"],
          evidence: [{ claim: "reference", source: "doc://razors.md" }],
          self_critique: ["may be shallow"],
          revision: "refined",
        };
      } else if (t.includes("divergent then convergent")) {
        payload = {
          divergent: ["idea1", "idea2", "idea3"],
          scores: [
            {
              id: 1,
              by: { novelty: 0.7, consistency: 0.6, relevance: 0.8 },
              notes: "ok",
            },
          ],
          winner: { id: 1, why: "best balance" },
          synthesis: "combine",
        };
      }
      return { content: { type: "text", text: JSON.stringify(payload) } };
    },
  };
  registerTool(name, _meta, handler) {
    this.tools.set(name, handler);
  }
  registerPrompt(name, _meta, builder) {
    this.prompts.set(name, builder);
  }
  registerResource(name, uri, meta, handler) {
    this.resources.set(name, { uri, meta, handler });
  }
}

function getHandler(server, name) {
  const h = server.tools.get(name);
  if (!h) throw new Error(`Tool not registered: ${name}`);
  return h;
}

function parseResult(res) {
  const content = Array.isArray(res?.content) ? res.content[0] : res?.content;
  const text = content?.text ?? content?.contents?.[0]?.text ?? "{}";
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

async function run() {
  const server = new TestHarnessServer();

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
  registerScientific(server);
  registerSelfExplain(server);
  registerDivergent(server);
  registerExec(server);
  registerSelector(server);
  registerReasoning(server);

  const out = [];
  const call = async (name, args) => {
    const res = await getHandler(server, name)(args);
    const json = parseResult(res);
    out.push({ tool: name, args, result: json });
    console.log(`OK: ${name}`);
  };

  // Router & selector
  await call("reasoning.router.plan", {
    task: "Plan migrating services",
    context: "optimize cost <= 500; include risk review; 3 features",
    maxSteps: 5,
  });
  await call("reasoning.selector", {
    request: "Investigate root cause of intermittent failure",
    context: "timeouts, spike at 02:00 UTC",
  });

  // Dialectic (aliases)
  await call("dialectic.tas", {
    claim: "We should ship v2 this quarter",
    context: "limited team capacity",
    audience: "exec",
  });
  await call("dialectic_tas", { claim: "Adopt feature flags across services" });

  // Socratic depths
  await call("socratic.inquire", {
    topic: "Service deprecation plan",
    depth: 2,
  });
  await call("socratic.inquire", {
    topic: "Cross-org data governance roadmap",
    depth: 5,
  });

  // Abductive (min/max k)
  await call("abductive.hypothesize", {
    observations: "Increased error rate after deploy",
    k: 2,
    apply_razors: ["MDL", "Popper"],
  });
  await call("abductive_hypothesize", {
    observations: "Latency spikes on Wednesdays",
    k: 10,
    apply_razors: [
      "MDL",
      "BayesianOccam",
      "Sagan",
      "Hitchens",
      "Hanlon",
      "Popper",
    ],
  });

  // Razors
  await call("razors.apply", {
    candidates_json: JSON.stringify([{ id: "H1" }, { id: "H2" }]),
    razors: ["MDL", "Sagan", "Hitchens", "Popper"],
  });

  // Analogical (with/without constraints, alias)
  await call("analogical.map", {
    source_domain: "Assembly line QA",
    target_problem: "CI flaky tests",
  });
  await call("analogical_map", {
    source_domain: "Traffic control",
    target_problem: "API rate limiting",
    constraints: "prioritize ambulances == prioritize critical services",
  });

  // Systems (with variables, alias)
  await call("systems.map", {
    variables: ["Supply", "Demand", "Inventory"],
    context: "retail",
  });
  await call("systems_map", { variables: [], context: "oncall handoffs" });

  // Red/Blue (rounds & focus)
  await call("redblue.challenge", {
    proposal: "Roll out auto-deploys",
    rounds: 1,
    focus: ["safety", "rollback"],
  });
  await call("redblue_challenge", {
    proposal: "Expose admin API externally",
    rounds: 3,
    focus: ["security", "privacy", "abuse"],
  });

  // Scientific (allow_tools variants, alias)
  await call("reasoning.scientific", {
    goal: "Pick sorting algorithm",
    context: "small arrays",
    allow_tools: true,
  });
  await call("reasoning_scientific", {
    goal: "Choose DB index",
    context: "point lookups",
    allow_tools: false,
  });

  // Self-explain (citations variants)
  await call("reasoning.self_explain", {
    query: "What is MDL?",
    allow_citations: true,
  });

  // Divergent (criteria, alias)
  await call("reasoning.divergent_convergent", {
    prompt: "Onboarding improvements",
    k: 3,
    criteria: ["impact", "effort"],
  });

  // Exec (normal + timeout)
  await call("exec.run", {
    code: "console.log('hello'); 2+2;",
    timeout_ms: 500,
  });
  await call("exec.run", { code: "for(;;){}", timeout_ms: 20 });

  // Constraint (sat + optimize)
  await call("constraint.solve", {
    model_json: JSON.stringify({
      variables: [{ name: "x", type: "Int" }],
      constraints: ["(> x 0)", "(< x 10)"],
    }),
  });
  await call("constraint.solve", {
    model_json: JSON.stringify({
      variables: [{ name: "x", type: "Int" }],
      constraints: ["(>= x 0)", "(<= x 3)"],
      optimize: { objective: "x", sense: "max" },
    }),
  });

  // Unified reasoning.run across all modes
  const run = (args) => call("reasoning.run", args);
  await run({
    mode: "plan",
    task: "Incident analysis",
    context: "5xx spike",
    maxSteps: 4,
  });
  await run({ mode: "socratic", topic: "Migrate to monorepo", depth: 3 });
  await run({ mode: "dialectic", claim: "Use GraphQL over REST" });
  await run({
    mode: "abductive",
    observations: "Cache miss ratio doubled",
    k: 4,
  });
  await run({
    mode: "razors",
    candidates_json: JSON.stringify([{ id: "A" }, { id: "B" }]),
    razors: ["MDL", "Popper"],
  });
  await run({
    mode: "analogical",
    source_domain: "Postal system",
    target_problem: "Event queues",
  });
  await run({
    mode: "systems",
    variables: ["Input", "Throughput", "Backlog"],
    context: "batch jobs",
  });
  await run({
    mode: "redblue",
    proposal: "Enable auto-merge",
    rounds: 2,
    focus: ["security", "safety"],
  });
  await run({
    mode: "scientific",
    goal: "Reduce TTFB",
    context: "static assets",
    allow_tools: true,
  });
  await run({ mode: "self_explain", query: "Explain CAP theorem" });
  await run({
    mode: "divergent",
    prompt: "Feature ideas for CLI",
    k: 4,
    criteria: ["novelty", "fit"],
  });
  await run({
    mode: "constraint",
    model_json: JSON.stringify({
      variables: [{ name: "x", type: "Int" }],
      constraints: ["x >= 2", "x <= 5"],
    }),
  });

  // Print compact summary
  const summary = out.map((e) => ({
    tool: e.tool,
    keys: Object.keys(e.result || {}),
  }));
  console.log("\nSUMMARY:", JSON.stringify(summary, null, 2));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
