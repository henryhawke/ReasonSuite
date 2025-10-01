#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import fs from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
import { registerScientific } from "./tools/scientific.js";
import { registerSelfExplain } from "./tools/self_explain.js";
import { registerDivergent } from "./tools/divergent.js";
import { registerExec } from "./tools/exec.js";
import { registerSelector } from "./tools/selector.js";
import { registerReasoning } from "./tools/reasoning.js";

// Prompts
import { registerDialecticPrompts } from "./prompts/dialectic.js";
import { registerSocraticPrompts } from "./prompts/socratic.js";
import { registerAbductivePrompts } from "./prompts/abductive.js";
import { registerSystemsPrompts } from "./prompts/systems.js";
import { registerRedBluePrompts } from "./prompts/redblue.js";
import { registerAnalogicalPrompts } from "./prompts/analogical.js";
import { registerConstraintPrompts } from "./prompts/constraint.js";
import { registerScientificPrompts } from "./prompts/scientific.js";
import { registerSelfExplainPrompts } from "./prompts/self_explain.js";
import { registerDivergentPrompts } from "./prompts/divergent.js";

const pkgJson = JSON.parse(
    await fs.readFile(new URL("../package.json", import.meta.url), "utf-8")
);

const server = new McpServer({ name: pkgJson.name ?? "reasonsuite", version: pkgJson.version ?? "0.0.0" });

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
registerScientific(server);
registerSelfExplain(server);
registerDivergent(server);
registerExec(server);
registerSelector(server);
registerReasoning(server);

// Register prompts
registerDialecticPrompts(server);
registerSocraticPrompts(server);
registerAbductivePrompts(server);
registerSystemsPrompts(server);
registerRedBluePrompts(server);
registerAnalogicalPrompts(server);
registerConstraintPrompts(server);
registerScientificPrompts(server);
registerSelfExplainPrompts(server);
registerDivergentPrompts(server);

const moduleDir = fileURLToPath(new URL(".", import.meta.url));

async function resolveResourcePath(file: string): Promise<string> {
    const candidates = [
        path.resolve(moduleDir, "resources", file),
        path.resolve(moduleDir, "../resources", file),
        path.resolve(moduleDir, "../src/resources", file),
        path.resolve(process.cwd(), "src/resources", file),
    ];

    for (const candidate of candidates) {
        try {
            await fs.access(candidate);
            return candidate;
        } catch {
            // Continue trying other candidates
        }
    }

    throw new Error(`Resource file not found: ${file}`);
}

async function addResource(file: string, title: string, description: string) {
    const p = await resolveResourcePath(file);
    server.registerResource(
        file,
        `doc://${file}`,
        { title, description, mimeType: "text/markdown" },
        async (uri) => ({ contents: [{ uri: uri.href, text: await fs.readFile(p, "utf-8") }] })
    );
}

await addResource("razors.md", "Reasoning Razors", "Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, Popper");
await addResource("systems-cheatsheet.md", "Systems Thinking Cheatsheet", "Causal loops, stocks/flows, leverage points");
await addResource("constraint-dsl.md", "Constraint DSL", "Mini-DSL compiled to Z3");
await addResource("master-prompt.md", "ReasonSuite Master Prompt", "Master prompt and tool snippets");

// Check and log operational mode
import { isLocalMode } from "./lib/llm.js";
const localMode = isLocalMode();
const modeDescription = localMode
    ? "LOCAL MODE (deterministic fallbacks, no external LLM calls)"
    : "CLOUD MODE (external LLM providers enabled)";

const mode = process.env.MCP_TRANSPORT ?? "stdio";

if (mode === "http") {
    const port = Number(process.env.PORT ?? 3333);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    const httpServer = createServer(async (req: any, res: any) => {
        try {
            await transport.handleRequest(req, res);
        } catch (err) {
            const message = (err as Error)?.message ?? "Internal server error";
            res.writeHead(500, { "content-type": "application/json" }).end(
                JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null })
            );
            console.error("Transport error", err);
        }
    });

    transport.onclose = () => {
        httpServer.close((err?: any) => {
            if (err) {
                console.error("Failed to close HTTP server", err);
            }
        });
    };

    await server.connect(transport);
    await new Promise<void>((resolve) => httpServer.listen(port, resolve));
    console.error(`ReasonSuite server listening on HTTP ${port} - ${modeDescription}`);
} else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`ReasonSuite server on stdio - ${modeDescription}`);
}
