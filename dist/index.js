import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import fs from "node:fs/promises";
import path from "node:path";
// Tools
import { registerDialectic } from "./tools/dialectic.js";
import { registerSocratic } from "./tools/socratic.js";
import { registerAbductive } from "./tools/abductive.js";
import { registerSystems } from "./tools/systems.js";
import { registerRedBlue } from "./tools/redblue.js";
import { registerAnalogical } from "./tools/analogical.js";
import { registerConstraint } from "./tools/constraint.js";
import { registerRazors } from "./tools/razors.js";
import { registerRouter } from "./router/router.js";
// Prompts
import { registerDialecticPrompts } from "./prompts/dialectic.js";
import { registerSocraticPrompts } from "./prompts/socratic.js";
import { registerAbductivePrompts } from "./prompts/abductive.js";
import { registerSystemsPrompts } from "./prompts/systems.js";
import { registerRedBluePrompts } from "./prompts/redblue.js";
import { registerAnalogicalPrompts } from "./prompts/analogical.js";
import { registerConstraintPrompts } from "./prompts/constraint.js";
const server = new McpServer({ name: "reason-suite-mcp", version: "0.1.0" });
// Register tools
registerRouter(server);
registerRazors(server);
registerDialectic(server);
registerSocratic(server);
registerAbductive(server);
registerSystems(server);
registerRedBlue(server);
registerAnalogical(server);
registerConstraint(server);
// Register prompts
registerDialecticPrompts(server);
registerSocraticPrompts(server);
registerAbductivePrompts(server);
registerSystemsPrompts(server);
registerRedBluePrompts(server);
registerAnalogicalPrompts(server);
registerConstraintPrompts(server);
async function addResource(file, title, description) {
    const p = path.resolve(process.cwd(), "src/resources", file);
    server.registerResource(file, `doc://${file}`, { title, description, mimeType: "text/markdown" }, async (uri) => ({ contents: [{ uri: uri.href, text: await fs.readFile(p, "utf-8") }] }));
}
await addResource("razors.md", "Reasoning Razors", "Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, Popper");
await addResource("systems-cheatsheet.md", "Systems Thinking Cheatsheet", "Causal loops, stocks/flows, leverage points");
await addResource("constraint-dsl.md", "Constraint DSL", "Mini-DSL compiled to Z3");
const mode = process.env.MCP_TRANSPORT ?? "stdio";
if (mode === "http") {
    const port = Number(process.env.PORT ?? 3333);
    const transport = new StreamableHTTPServerTransport({ port });
    await server.connect(transport);
    console.log("ReasonSuite MCP server listening on HTTP " + port);
}
else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("ReasonSuite MCP server on stdio");
}
