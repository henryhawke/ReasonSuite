// Comprehensive reasoning flow test system for ReasonSuite MCP server
// Tests logical processes, tool selection, razor application, and proof workflows

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

class ReasoningTestServer {
  tools = new Map();
  prompts = new Map();
  resources = new Map();
  callHistory = [];

  server = {
    createMessage: async ({ messages }) => {
      const text = messages?.[0]?.content?.text ?? "";
      const t = text.toLowerCase();
      this.callHistory.push({ prompt: text.substring(0, 100) + "..." });

      // Router planning responses
      if (t.includes("you are a planner") || t.includes("planning assistant")) {
        if (
          t.includes("constraint") ||
          t.includes("optimi") ||
          t.includes("<=") ||
          t.includes("budget")
        ) {
          return {
            content: {
              type: "text",
              text: JSON.stringify({
                steps: [
                  {
                    mode: "constraint",
                    tool: "constraint.solve",
                    why: "Mathematical optimization problem",
                    args: {},
                  },
                  {
                    mode: "razors.apply",
                    tool: "razors.apply",
                    why: "Validate solution simplicity",
                    args: { razors: ["MDL", "Popper"] },
                  },
                ],
                notes: "Constraint-first approach for optimization",
              }),
            },
          };
        }
        if (
          t.includes("diagnos") ||
          t.includes("root cause") ||
          t.includes("anomal")
        ) {
          return {
            content: {
              type: "text",
              text: JSON.stringify({
                steps: [
                  {
                    mode: "socratic",
                    tool: "socratic.inquire",
                    why: "Clarify the problem scope",
                    args: { depth: 2 },
                  },
                  {
                    mode: "abductive",
                    tool: "abductive.hypothesize",
                    why: "Generate candidate explanations",
                    args: { k: 4, apply_razors: ["MDL", "Hitchens", "Popper"] },
                  },
                  {
                    mode: "razors.apply",
                    tool: "razors.apply",
                    why: "Prune weak hypotheses",
                    args: { razors: ["MDL", "Sagan", "Popper"] },
                  },
                ],
                notes: "Diagnostic reasoning workflow",
              }),
            },
          };
        }
        if (
          t.includes("system") ||
          t.includes("feedback") ||
          t.includes("dynamic")
        ) {
          return {
            content: {
              type: "text",
              text: JSON.stringify({
                steps: [
                  {
                    mode: "systems",
                    tool: "systems.map",
                    why: "Map system dynamics",
                    args: {},
                  },
                  {
                    mode: "redblue",
                    tool: "redblue.challenge",
                    why: "Stress test interventions",
                    args: { rounds: 2 },
                  },
                ],
                notes: "Systems thinking approach",
              }),
            },
          };
        }
        return {
          content: {
            type: "text",
            text: JSON.stringify({
              steps: [
                {
                  mode: "socratic",
                  tool: "socratic.inquire",
                  why: "Scope clarification",
                  args: { depth: 2 },
                },
                {
                  mode: "scientific",
                  tool: "reasoning.scientific",
                  why: "Structured analysis",
                  args: { allow_tools: true },
                },
              ],
              notes: "General reasoning approach",
            }),
          },
        };
      }

      // Selector responses
      if (t.includes("meta-selector") || t.includes("recommend")) {
        if (t.includes("diagnos") || t.includes("root cause")) {
          return {
            content: {
              type: "text",
              text: JSON.stringify({
                primary_mode: {
                  id: "abductive",
                  label: "Abductive Reasoning",
                  confidence: 0.85,
                  reason: "Diagnostic task requires hypothesis generation",
                },
                supporting_modes: [
                  {
                    id: "razors.apply",
                    label: "Razor Screening",
                    score: 0.75,
                    reason: "Prune weak hypotheses",
                  },
                  {
                    id: "socratic",
                    label: "Socratic Inquiry",
                    score: 0.65,
                    reason: "Clarify problem scope",
                  },
                ],
                razor_stack: [
                  {
                    id: "MDL",
                    label: "Minimum Description Length",
                    score: 0.8,
                    reason: "Favor simple explanations",
                  },
                  {
                    id: "Popper",
                    label: "Falsifiability",
                    score: 0.7,
                    reason: "Ensure testable hypotheses",
                  },
                ],
                decision_path: [
                  {
                    observation: "Diagnostic language detected",
                    implication: "Use abductive reasoning",
                  },
                  {
                    observation: "Multiple explanations possible",
                    implication: "Apply razors for pruning",
                  },
                ],
                next_action:
                  "Generate hypotheses with abductive tool, then apply MDL and Popper razors",
              }),
            },
          };
        }
        if (
          t.includes("optimi") ||
          t.includes("constraint") ||
          t.includes("allocat")
        ) {
          return {
            content: {
              type: "text",
              text: JSON.stringify({
                primary_mode: {
                  id: "constraint",
                  label: "Constraint Solver",
                  confidence: 0.9,
                  reason: "Optimization problem with explicit constraints",
                },
                supporting_modes: [],
                razor_stack: [
                  {
                    id: "MDL",
                    label: "Minimum Description Length",
                    score: 0.6,
                    reason: "Prefer simpler models",
                  },
                ],
                decision_path: [
                  {
                    observation: "Optimization keywords detected",
                    implication: "Use constraint solving",
                  },
                ],
                next_action: "Model as constraint satisfaction problem",
              }),
            },
          };
        }
      }

      // Tool-specific responses
      if (t.includes("socratic question tree")) {
        return {
          content: {
            type: "text",
            text: JSON.stringify({
              layers: [
                {
                  level: 1,
                  questions: [
                    "What exactly is the problem?",
                    "What are the success criteria?",
                    "What constraints exist?",
                  ],
                },
                {
                  level: 2,
                  questions: [
                    "What evidence supports this framing?",
                    "What assumptions are we making?",
                    "What could we be missing?",
                  ],
                },
                {
                  level: 3,
                  questions: [
                    "How would we test these assumptions?",
                    "What would change our conclusion?",
                  ],
                },
              ],
              assumptions_to_test: [
                "Problem is well-defined",
                "Success criteria are measurable",
                "Constraints are fixed",
              ],
              evidence_to_collect: [
                "Historical data",
                "Stakeholder input",
                "Technical specifications",
              ],
              next_actions: [
                "Validate assumptions",
                "Gather evidence",
                "Refine problem statement",
              ],
            }),
          },
        };
      }

      if (t.includes("dialectical frame") || t.includes("thesis")) {
        return {
          content: {
            type: "text",
            text: JSON.stringify({
              thesis: {
                position: "Proceed with current approach",
                key_points: [
                  "Proven track record",
                  "Resource efficiency",
                  "Time constraints",
                ],
              },
              antithesis: {
                position: "Consider alternative approaches",
                key_points: [
                  "Risk of status quo",
                  "Missed opportunities",
                  "Long-term costs",
                ],
              },
              synthesis: {
                proposal: "Hybrid approach with staged implementation",
                assumptions: [
                  "Resources can be reallocated",
                  "Timeline is flexible",
                ],
                tradeoffs: ["Speed vs. thoroughness", "Cost vs. risk"],
                evidence_needed: [
                  "Pilot results",
                  "Stakeholder feedback",
                  "Risk assessment",
                ],
              },
              open_questions: [
                "What are the real constraints?",
                "How do we measure success?",
              ],
            }),
          },
        };
      }

      if (t.includes("abductive hypotheses") || t.includes("observations:")) {
        return {
          content: {
            type: "text",
            text: JSON.stringify({
              hypotheses: [
                {
                  id: "H1",
                  statement: "Configuration change caused the issue",
                  rationale: "Timing aligns with deployment",
                  scores: {
                    prior_plausibility: 0.7,
                    explanatory_power: 0.8,
                    simplicity_penalty: 0.2,
                    testability: 0.9,
                    overall: 2.2,
                  },
                },
                {
                  id: "H2",
                  statement: "External dependency failure",
                  rationale: "Intermittent pattern suggests external cause",
                  scores: {
                    prior_plausibility: 0.5,
                    explanatory_power: 0.6,
                    simplicity_penalty: 0.3,
                    testability: 0.7,
                    overall: 1.5,
                  },
                },
              ],
              experiments_or_evidence: [
                "Check deployment logs",
                "Monitor external services",
                "A/B test configuration",
              ],
              notes: "Configuration hypothesis scores highest on testability",
            }),
          },
        };
      }

      if (t.includes("candidates json") || t.includes("razors")) {
        return {
          content: {
            type: "text",
            text: JSON.stringify({
              results: [
                {
                  id: "H1",
                  keep_or_drop: "keep",
                  reasons: [
                    "Simplest explanation (MDL)",
                    "Directly testable (Popper)",
                    "Strong evidence support",
                  ],
                  risk_notes: "Low risk - can be quickly validated",
                },
                {
                  id: "H2",
                  keep_or_drop: "revise",
                  reasons: [
                    "More complex (MDL penalty)",
                    "Harder to test (Popper concern)",
                  ],
                  risk_notes: "Medium risk - requires external validation",
                },
              ],
              shortlist: ["H1"],
              notes: "H1 passes all razor tests, H2 needs refinement",
            }),
          },
        };
      }

      if (t.includes("causal loop diagram")) {
        return {
          content: {
            type: "text",
            text: JSON.stringify({
              mermaid:
                "graph LR; Load[System Load] --> Response[Response Time]; Response --> UserExp[User Experience]; UserExp --> Usage[System Usage]; Usage --> Load; Response --> Alerts[Alerts]; Alerts --> Intervention[Intervention]; Intervention --> Load;",
              loops: [
                {
                  type: "reinforcing",
                  nodes: ["Load", "Response", "UserExp", "Usage"],
                },
                {
                  type: "balancing",
                  nodes: ["Response", "Alerts", "Intervention", "Load"],
                },
              ],
              leverage_points: [
                "Alert thresholds",
                "Auto-scaling rules",
                "Circuit breakers",
              ],
              stock_flow_hints: [
                {
                  stock: "Active Users",
                  inflows: ["New Sessions"],
                  outflows: ["Session Timeouts"],
                },
                {
                  stock: "System Capacity",
                  inflows: ["Scaling Up"],
                  outflows: ["Resource Limits"],
                },
              ],
              assumptions: [
                "Linear load-response relationship",
                "Predictable user behavior",
              ],
              risks: [
                "Cascade failures",
                "Delayed feedback",
                "Non-linear scaling effects",
              ],
            }),
          },
        };
      }

      if (t.includes("red (attack) vs blue") || t.includes("adversarial")) {
        return {
          content: {
            type: "text",
            text: JSON.stringify({
              rounds: [
                {
                  n: 1,
                  red: { attack: "Exploit authentication bypass in edge case" },
                  blue: {
                    defense: "Multi-factor authentication",
                    mitigations: ["Rate limiting", "Anomaly detection"],
                  },
                },
                {
                  n: 2,
                  red: { attack: "Social engineering to gain insider access" },
                  blue: {
                    defense: "Security awareness training",
                    mitigations: [
                      "Zero trust architecture",
                      "Privilege escalation monitoring",
                    ],
                  },
                },
              ],
              defects: [
                {
                  type: "authentication",
                  severity: "high",
                  evidence: "Edge case not covered in tests",
                },
                {
                  type: "social_engineering",
                  severity: "med",
                  evidence: "Human factor vulnerability",
                },
              ],
              risk_matrix: {
                low: ["Minor UI bugs"],
                medium: ["Social engineering", "Performance degradation"],
                high: ["Authentication bypass", "Data breach"],
              },
              final_guidance: [
                "Patch authentication edge case",
                "Enhance security training",
                "Implement zero trust",
              ],
            }),
          },
        };
      }

      if (t.includes("scientific analytic framework")) {
        return {
          content: {
            type: "text",
            text: JSON.stringify({
              decomposition: [
                "Define problem precisely",
                "Identify variables",
                "Establish constraints",
                "Design experiments",
              ],
              hypotheses: [
                "H1: Simple fix will resolve issue",
                "H2: Systematic redesign needed",
              ],
              tests: [
                "Unit tests for edge cases",
                "Load testing",
                "A/B testing",
                "Constraint validation",
              ],
              verification: {
                strategy: "Empirical testing with controls",
                popper_falsification:
                  "What evidence would prove this approach wrong?",
              },
              answer: "Systematic testing approach with falsifiable hypotheses",
            }),
          },
        };
      }

      if (t.includes("transparent self-explanation")) {
        return {
          content: {
            type: "text",
            text: JSON.stringify({
              rationale: [
                "Analyzed problem structure and constraints",
                "Applied systematic reasoning framework",
                "Validated conclusions against evidence",
              ],
              evidence: [
                {
                  claim: "MDL principle guides simplicity",
                  source: "doc://razors.md",
                },
                {
                  claim: "Popper falsifiability ensures testability",
                  source: "doc://razors.md",
                },
              ],
              self_critique: [
                "May have overlooked edge cases",
                "Assumptions about user behavior need validation",
                "Time constraints may affect thoroughness",
              ],
              revision:
                "Recommendation stands but requires validation testing and monitoring",
            }),
          },
        };
      }

      if (t.includes("divergent then convergent")) {
        return {
          content: {
            type: "text",
            text: JSON.stringify({
              divergent: [
                "Incremental improvement approach",
                "Complete system redesign",
                "Hybrid migration strategy",
                "Gradual feature rollout",
              ],
              scores: [
                {
                  id: 1,
                  by: { feasibility: 0.9, impact: 0.6, risk: 0.8 },
                  notes: "Low risk, moderate impact",
                },
                {
                  id: 2,
                  by: { feasibility: 0.3, impact: 0.9, risk: 0.2 },
                  notes: "High impact, high risk",
                },
                {
                  id: 3,
                  by: { feasibility: 0.7, impact: 0.8, risk: 0.6 },
                  notes: "Balanced approach",
                },
                {
                  id: 4,
                  by: { feasibility: 0.8, impact: 0.7, risk: 0.7 },
                  notes: "Gradual, manageable",
                },
              ],
              winner: {
                id: 3,
                why: "Best balance of feasibility, impact, and manageable risk",
              },
              synthesis:
                "Hybrid migration with phased rollout and continuous monitoring",
            }),
          },
        };
      }

      // Default fallback
      return {
        content: {
          type: "text",
          text: JSON.stringify({ result: "reasoning complete" }),
        },
      };
    },
  };

  registerTool(name, meta, handler) {
    this.tools.set(name, handler);
  }

  registerPrompt(name, meta, builder) {
    this.prompts.set(name, builder);
  }

  registerResource(name, uri, meta, handler) {
    this.resources.set(name, { uri, meta, handler });
  }
}

class ReasoningFlowTest {
  constructor(server) {
    this.server = server;
    this.results = [];
  }

  async callTool(name, args) {
    const handler = this.server.tools.get(name);
    if (!handler) throw new Error(`Tool ${name} not found`);

    const result = await handler(args);
    const content = Array.isArray(result?.content)
      ? result.content[0]
      : result?.content;
    const text = content?.text ?? content?.contents?.[0]?.text ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { _raw: text };
    }

    return parsed;
  }

  async testLogicalProofWorkflow() {
    console.log("\n=== Testing Logical Proof Workflow ===");

    // 1. Use selector to choose reasoning approach
    const selection = await this.callTool("reasoning.selector", {
      request: "Prove that our caching strategy is optimal",
      context: "High latency, memory constraints, cost optimization needed",
    });

    console.log("✓ Selector chose:", selection.primary_mode?.label);
    this.assert(
      selection.primary_mode?.id,
      "Selector must choose primary mode"
    );

    // 2. Use router to plan the proof
    const plan = await this.callTool("reasoning.router.plan", {
      task: "Prove caching strategy optimality with constraints: memory <= 4GB, latency <= 100ms",
      context: "optimization problem with measurable constraints",
      maxSteps: 4,
    });

    console.log("✓ Router planned", plan.steps?.length, "steps");
    this.assert(plan.steps?.length > 0, "Router must generate steps");

    // 3. Execute constraint solving (should be first step for optimization)
    const constraintResult = await this.callTool("constraint.solve", {
      model_json: JSON.stringify({
        variables: [
          { name: "cache_size", type: "Int" },
          { name: "hit_rate", type: "Real" },
        ],
        constraints: [
          "(>= cache_size 0)",
          "(<= cache_size 4096)",
          "(>= hit_rate 0.0)",
          "(<= hit_rate 1.0)",
          "(>= (* cache_size hit_rate) 1000)",
        ],
        optimize: { objective: "cache_size", sense: "min" },
      }),
    });

    console.log("✓ Constraint solver found:", constraintResult.status);
    this.assert(
      constraintResult.status === "sat",
      "Constraint problem must be satisfiable"
    );
    this.assert(constraintResult.model, "Must return model");

    // 4. Apply razors to validate the solution
    const razorResult = await this.callTool("razors.apply", {
      candidates_json: JSON.stringify([
        { id: "optimal", solution: constraintResult.model },
      ]),
      razors: ["MDL", "Popper"],
    });

    console.log(
      "✓ Razors applied:",
      razorResult.shortlist?.length,
      "candidates kept"
    );
    this.assert(
      razorResult.results?.length > 0,
      "Razors must evaluate candidates"
    );

    return { selection, plan, constraintResult, razorResult };
  }

  async testDiagnosticWorkflow() {
    console.log("\n=== Testing Diagnostic Reasoning Workflow ===");

    // 1. Selector recommends diagnostic approach
    const selection = await this.callTool("reasoning.selector", {
      request: "Diagnose intermittent service failures",
      context:
        "Error rate spikes randomly, no clear pattern, affects 5% of requests",
    });

    console.log("✓ Diagnostic selector:", selection.primary_mode?.label);

    // 2. Socratic inquiry to clarify the problem
    const socratic = await this.callTool("socratic.inquire", {
      topic: "Intermittent service failures",
      depth: 3,
    });

    console.log("✓ Socratic generated", socratic.layers?.length, "layers");
    this.assert(
      socratic.assumptions_to_test?.length > 0,
      "Must identify assumptions"
    );

    // 3. Abductive reasoning to generate hypotheses
    const hypotheses = await this.callTool("abductive.hypothesize", {
      observations:
        "5% error rate, random timing, no correlation with load or time",
      k: 4,
      apply_razors: ["MDL", "Hitchens", "Popper"],
    });

    console.log("✓ Generated", hypotheses.hypotheses?.length, "hypotheses");
    this.assert(hypotheses.hypotheses?.length > 0, "Must generate hypotheses");

    // 4. Apply razors to filter hypotheses
    const filtered = await this.callTool("razors.apply", {
      candidates_json: JSON.stringify(hypotheses.hypotheses || []),
      razors: ["MDL", "Sagan", "Popper"],
    });

    console.log("✓ Filtered to", filtered.shortlist?.length, "hypotheses");
    this.assert(
      filtered.shortlist?.length > 0,
      "Must keep at least one hypothesis"
    );

    return { selection, socratic, hypotheses, filtered };
  }

  async testSystemsThinkingWorkflow() {
    console.log("\n=== Testing Systems Thinking Workflow ===");

    // 1. Map system dynamics
    const systemsMap = await this.callTool("systems.map", {
      variables: [
        "User Load",
        "Response Time",
        "Error Rate",
        "Customer Satisfaction",
      ],
      context: "Web service performance optimization",
    });

    console.log(
      "✓ Systems map created with",
      systemsMap.loops?.length,
      "loops"
    );
    this.assert(systemsMap.mermaid, "Must generate mermaid diagram");
    this.assert(systemsMap.loops?.length > 0, "Must identify feedback loops");

    // 2. Red/Blue challenge the system
    const redblue = await this.callTool("redblue.challenge", {
      proposal: "Implement auto-scaling based on response time",
      rounds: 3,
      focus: ["safety", "performance", "cost"],
    });

    console.log("✓ Red/Blue completed", redblue.rounds?.length, "rounds");
    this.assert(
      redblue.rounds?.length > 0,
      "Must complete attack/defense rounds"
    );
    this.assert(redblue.risk_matrix, "Must provide risk assessment");

    return { systemsMap, redblue };
  }

  async testUnifiedInterface() {
    console.log("\n=== Testing Unified reasoning.run Interface ===");

    const modes = [
      {
        mode: "plan",
        args: { task: "Optimize database queries", maxSteps: 3 },
      },
      {
        mode: "socratic",
        args: { topic: "Query optimization strategy", depth: 2 },
      },
      { mode: "dialectic", args: { claim: "Indexes improve performance" } },
      {
        mode: "abductive",
        args: { observations: "Query time increased 300%", k: 3 },
      },
      {
        mode: "constraint",
        args: {
          model_json: JSON.stringify({
            variables: [{ name: "index_count", type: "Int" }],
            constraints: ["(>= index_count 0)", "(<= index_count 10)"],
          }),
        },
      },
      {
        mode: "scientific",
        args: { goal: "Validate query optimization", allow_tools: true },
      },
    ];

    const results = [];
    for (const { mode, args } of modes) {
      const result = await this.callTool("reasoning.run", { mode, ...args });
      console.log(`✓ reasoning.run(${mode}) completed`);
      this.assert(
        result && typeof result === "object",
        `Mode ${mode} must return object`
      );
      results.push({ mode, result });
    }

    return results;
  }

  async testRazorApplication() {
    console.log("\n=== Testing Razor Application ===");

    const candidates = [
      { id: "complex", description: "Multi-layer caching with ML prediction" },
      { id: "simple", description: "Basic LRU cache" },
      { id: "extraordinary", description: "Quantum-enhanced caching system" },
    ];

    const razorTests = [
      { razors: ["MDL"], expected: "simple" },
      { razors: ["Sagan"], expected: "simple" },
      { razors: ["MDL", "Sagan", "Popper"], expected: "simple" },
    ];

    for (const { razors, expected } of razorTests) {
      const result = await this.callTool("razors.apply", {
        candidates_json: JSON.stringify(candidates),
        razors,
      });

      console.log(
        `✓ Razors ${razors.join(",")} kept:`,
        result.shortlist?.length
      );
      this.assert(result.results?.length > 0, "Must evaluate all candidates");
    }
  }

  async testExecutionSandbox() {
    console.log("\n=== Testing Execution Sandbox ===");

    // Test successful execution
    const success = await this.callTool("exec.run", {
      code: `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n-1) + fibonacci(n-2);
        }
        console.log("fib(5) =", fibonacci(5));
        fibonacci(5);
      `,
      timeout_ms: 1000,
    });

    console.log("✓ Execution succeeded:", success.result);
    this.assert(success.stdout?.length > 0, "Must capture stdout");
    this.assert(success.result === 5, "Must return correct result");

    // Test timeout
    const timeout = await this.callTool("exec.run", {
      code: "while(true) { /* infinite loop */ }",
      timeout_ms: 100,
    });

    console.log("✓ Timeout handled:", timeout.timedOut);
    this.assert(timeout.timedOut === true, "Must handle timeouts");
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  async runAllTests() {
    console.log("🧠 Starting Comprehensive Reasoning Test Suite");
    console.log("=".repeat(50));

    try {
      const logicalProof = await this.testLogicalProofWorkflow();
      const diagnostic = await this.testDiagnosticWorkflow();
      const systems = await this.testSystemsThinkingWorkflow();
      const unified = await this.testUnifiedInterface();
      await this.testRazorApplication();
      await this.testExecutionSandbox();

      console.log("\n" + "=".repeat(50));
      console.log("🎉 ALL TESTS PASSED!");
      console.log(`📊 Total LLM calls: ${this.server.callHistory.length}`);
      console.log(`🔧 Tools registered: ${this.server.tools.size}`);

      return {
        success: true,
        workflows: { logicalProof, diagnostic, systems, unified },
        stats: {
          llmCalls: this.server.callHistory.length,
          toolsRegistered: this.server.tools.size,
        },
      };
    } catch (error) {
      console.error("\n❌ TEST FAILED:", error.message);
      console.error(error.stack);
      return { success: false, error: error.message };
    }
  }
}

async function main() {
  const server = new ReasoningTestServer();

  // Register all tools
  registerRouter(server);
  registerSelector(server);
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
  registerReasoning(server);

  const tester = new ReasoningFlowTest(server);
  const results = await tester.runAllTests();

  if (!results.success) {
    process.exit(1);
  }
}

main().catch(console.error);

