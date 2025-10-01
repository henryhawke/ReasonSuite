import assert from "node:assert/strict";
import { registerReasoning } from "./dist/tools/reasoning.js";
import { registerRouter, __routerTestUtils } from "./dist/router/router.js";
import { registerConstraint } from "./dist/tools/constraint.js";
import { registerExec } from "./dist/tools/exec.js";
import { registerRazors } from "./dist/tools/razors.js";
import { registerSocratic } from "./dist/tools/socratic.js";

class TestServer {
    tools = new Map();
    server = {
        createMessage: async ({ messages }) => {
            const text = messages[0].content.text;
            console.log("Mock LLM called with prompt length:", text.length);

            // Mock responses for different modes
            if (text.includes("You are a planner")) {
                return { content: { type: "text", text: JSON.stringify({
                    steps: [
                        { mode: "socratic", why: "Scope the problem", args: { depth: 2 } },
                        { mode: "abductive", why: "Generate hypotheses", args: { k: 3 } },
                        { mode: "razors", why: "Apply critical evaluation", args: { razors: ["MDL", "Popper"] } }
                    ],
                    notes: "Test plan for ReasonSuite analysis"
                }) }};
            }

            if (text.includes("Socratic question tree")) {
                return { content: { type: "text", text: JSON.stringify({
                    layers: [
                        { level: 1, questions: ["What are the core architectural changes?", "How does unification affect usability?"] },
                        { level: 2, questions: ["What specific benefits does the unified interface provide?", "Are there any downsides to consolidation?"] }
                    ],
                    assumptions_to_test: ["Unified interface is simpler for users"],
                    evidence_to_collect: ["User feedback", "Performance metrics"],
                    next_actions: ["Test with different reasoning modes", "Compare API complexity"]
                }) }};
            }

            // Default fallback
            return { content: { type: "text", text: JSON.stringify({ result: "mock response" }) }};
        }
    };
    registerTool(name, config, handler) {
        console.log(`Registering tool: ${name}`);
        this.tools.set(name, handler);
    }
}

class FallbackServer extends TestServer {
    constructor() {
        super();
        this.server.createMessage = async () => ({ content: { type: "text", text: "" } });
    }
}

const server = new TestServer();

// Register the core tools
registerRouter(server);
registerReasoning(server);
registerConstraint(server);
registerExec(server);
registerRazors(server);
registerSocratic(server);

console.log("Registered tools:", Array.from(server.tools.keys()));

// Test the new unified reasoning tool
console.log("\n=== Testing reasoning.run with mode: plan ===");
const planHandler = server.tools.get("reasoning.run");
const planResultRaw = await planHandler({
    mode: "plan",
    task: "Analyze ReasonSuite architecture improvements",
    context: "Testing the new unified reasoning interface",
    maxSteps: 3
});
const planResult = JSON.parse(planResultRaw.content[0].text);
console.log("Plan result:", planResult);
assert.equal(planResult.steps?.[0]?.mode, "socratic", "Planner should retain socratic first step");

console.log("\n=== Testing reasoning.run with mode: socratic ===");
const socraticResultRaw = await planHandler({
    mode: "socratic",
    topic: "ReasonSuite unified architecture benefits",
    depth: 2
});
const socraticResult = JSON.parse(socraticResultRaw.content[0].text);
console.log("Socratic result:", socraticResult);

console.log("\n=== Testing reasoning.run with mode: razors (object input) ===");
const razorsResultRaw = await planHandler({
    mode: "razors",
    candidates_json: [{ id: "H1", statement: "Test" }]
});
const razorsResult = JSON.parse(razorsResultRaw.content[0].text);
console.log("Razors result:", razorsResult);
assert.ok(Array.isArray(razorsResult.shortlist), "Razors run should succeed when candidates_json is an object");

console.log("\n=== Testing constraint tool ===");
const constraintHandler = server.tools.get("constraint.solve");
const constraintResult = await constraintHandler({
    model_json: JSON.stringify({
        variables: [{ name: "x", type: "Int" }],
        constraints: ["x > 0", "x < 10"]
    })
});
console.log("Constraint result:", JSON.parse(constraintResult.content[0].text));

console.log("\n=== Testing exec tool ===");
const execHandler = server.tools.get("exec.run");
const execResult = await execHandler({
    code: "console.log('Testing unified ReasonSuite!'); 2 + 2;"
});
console.log("Exec result:", JSON.parse(execResult.content[0].text));

console.log("\n=== Testing router fallback heuristics ===");
const fallbackServer = new FallbackServer();
registerRouter(fallbackServer);
const fallbackHandler = fallbackServer.tools.get("reasoning.router.plan");

const shortPlanRaw = await fallbackHandler({
    task: "Diagnose outage with little info",
    context: "production incident",
    maxSteps: 2
});
const shortPlan = JSON.parse(shortPlanRaw.content[0].text);
console.log("Short plan:", shortPlan);
const shortModes = shortPlan.steps?.map((step) => step.mode) ?? [];
assert(shortModes.includes("abductive"), "Short plans must retain generator step when maxSteps is limited");

const releasePlanRaw = await fallbackHandler({
    task: "Plan release notes for version 2",
    maxSteps: 4
});
const releasePlan = JSON.parse(releasePlanRaw.content[0].text);
console.log("Release plan:", releasePlan);
const releaseModes = releasePlan.steps?.map((step) => step.mode) ?? [];
assert(!releaseModes.includes("constraint"), "Digit-only tasks should not trigger constraint mode");

console.log("\n=== Testing mode alias normalization ===");
const { determineMode } = __routerTestUtils;
assert.equal(determineMode("clarify scope", "socratic.inquire"), "socratic");
assert.equal(determineMode("generate and test explanations", "abductive.hypothesize"), "abductive");
assert.equal(determineMode("prune and refine", "razors.apply"), "razors.apply");
