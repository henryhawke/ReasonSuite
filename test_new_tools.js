import { registerReasoning } from "./dist/tools/reasoning.js";
import { registerRouter } from "./dist/router/router.js";
import { registerConstraint } from "./dist/tools/constraint.js";
import { registerExec } from "./dist/tools/exec.js";

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

const server = new TestServer();

// Register the core tools
registerRouter(server);
registerReasoning(server);
registerConstraint(server);
registerExec(server);

console.log("Registered tools:", Array.from(server.tools.keys()));

// Test the new unified reasoning tool
console.log("\n=== Testing reasoning.run with mode: plan ===");
const planHandler = server.tools.get("reasoning.run");
const planResult = await planHandler({
    mode: "plan",
    task: "Analyze ReasonSuite architecture improvements",
    context: "Testing the new unified reasoning interface",
    maxSteps: 3
});
console.log("Plan result:", JSON.parse(planResult.content[0].text));

console.log("\n=== Testing reasoning.run with mode: socratic ===");
const socraticResult = await planHandler({
    mode: "socratic",
    topic: "ReasonSuite unified architecture benefits",
    depth: 2
});
console.log("Socratic result:", JSON.parse(socraticResult.content[0].text));

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