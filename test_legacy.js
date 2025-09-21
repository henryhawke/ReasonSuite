// Test with legacy tools
process.env.REASONSUITE_ENABLE_LEGACY = "1";

import { registerRouter } from "./dist/router/router.js";
import { registerReasoning } from "./dist/tools/reasoning.js";
import { registerConstraint } from "./dist/tools/constraint.js";
import { registerExec } from "./dist/tools/exec.js";
import { registerRazors } from "./dist/tools/razors.js";
import { registerDialectic } from "./dist/tools/dialectic.js";
import { registerSocratic } from "./dist/tools/socratic.js";
import { registerAbductive } from "./dist/tools/abductive.js";

class TestServer {
    tools = new Map();
    server = { createMessage: async () => ({ content: { type: "text", text: "{}" } }) };
    registerTool(name, config, handler) {
        console.log(`Registering tool: ${name}`);
        this.tools.set(name, handler);
    }
}

const server = new TestServer();

// Register core tools
registerRouter(server);
registerReasoning(server);
registerConstraint(server);
registerExec(server);

// Test legacy registration logic
console.log("REASONSUITE_ENABLE_LEGACY:", process.env.REASONSUITE_ENABLE_LEGACY);
if (process.env.REASONSUITE_ENABLE_LEGACY === "1") {
    console.log("Registering legacy tools...");
    registerRazors(server);
    registerDialectic(server);
    registerSocratic(server);
    registerAbductive(server);
} else {
    console.log("Legacy tools not enabled");
}

console.log("\nAll registered tools:", Array.from(server.tools.keys()));

// Test both unified and legacy interfaces
console.log("\n=== Testing unified reasoning.run ===");
const unifiedHandler = server.tools.get("reasoning.run");
if (unifiedHandler) {
    const result = await unifiedHandler({ mode: "socratic", topic: "test", depth: 2 });
    console.log("Unified socratic works");
} else {
    console.log("Unified reasoning.run not found");
}

console.log("\n=== Testing legacy socratic.inquire ===");
const legacyHandler = server.tools.get("socratic.inquire");
if (legacyHandler) {
    console.log("Legacy socratic.inquire is available");
} else {
    console.log("Legacy socratic.inquire not found");
}