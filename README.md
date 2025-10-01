# ReasonSuite

MCP for using logical razors and types of reasoning. ReasonSuite is a structured thinking framework that helps a model work through any problem. Give your model trusted logical heuristics instead of relying solely on an llm's emergent reasoning.

** npm i reasonsuite **

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=ReasonSuite&config=eyJjb21tYW5kIjoibnB4IC15IHJlYXNvbnN1aXRlIn0%3D)

 [📖 Instructional Prompt](cursor://anysphere.cursor-deeplink/prompt?text=Developer%3A%20You%20are%20connected%20to%20an%20MCP%20server%20named%20%22reasonsuite%2C%22%20which%20provides%20structured%20reasoning%20tools.%0A%0A%E2%9A%A0%20Critical%3A%20All%20tools%20return%20strict%20JSON%20only%E2%80%94no%20Markdown%20fences%20are%20allowed.%20Tools%20must%20implement%20deterministic%20fallbacks%20(see%20%22fallback%22%20in%20the%20meta%20source).%20If%20any%20validation%20issues%20arise%2C%20details%20must%20go%20in%20the%20%60meta.warnings%60%20field%20of%20the%20output.%20The%20response%20should%20be%20a%20bullet-point%20summary%20of%20the%20JSON%20artifacts%3B%20refer%20to%20the%20Output%20Format%20section%20for%20precise%20structure.%0A%0ABefore%20beginning%2C%20provide%20a%20concise%20checklist%20(3-7%20bullets)%20of%20intended%20sub-tasks%20for%20the%20workflow%20at%20hand%2C%20and%20take%20care%20to%20select%20the%20most%20appropriate%20tool(s)%20for%20each%20task%20step.%0A%0AWorkflow%3A%0A1.%20Intake%20%E2%86%92%20Restate%20goal%20and%20identify%20any%20knowledge%20or%20context%20gaps%0A2.%20Planning%20%E2%86%92%20Use%20%60reasoning.router.plan%60%20for%20multi-step%20tasks%2C%20%60reasoning.selector%60%20for%20single-tool%20selection.%20For%20each%20decision%20point%2C%20consider%20which%20tool%20is%20optimal%20for%20the%20immediate%20task%2C%20referencing%20the%20Tool%20Reference%20and%20Output%20Format%20for%20correct%20use%20to%20avoid%20misuse.%0A3.%20Execution%20%E2%86%92%20Follow%20the%20plan's%20step%20order.%20Pass%20%60%24%7Brequest%2C%20context%2FpriorArtifacts%7D%60%20for%20artifact%20reuse.%20Use%20%60abductive.hypothesize%60%20and%2For%20%60reasoning.divergent_convergent%60%20paired%20with%20%60razors.apply%60%20as%20appropriate.%20Carefully%20ensure%20each%20tool%20invoked%20is%20necessary%20and%20fits%20the%20purpose%20described%20in%20Tool%20Reference.%0A4.%20Risk%20%E2%86%92%20Apply%20%60redblue.challenge%60%20for%20safety%2Fdeployment%20risk%20analysis%2C%20%60reasoning.scientific%60%20for%20testing%2C%20%60exec.run%60%20for%20calculations%2C%20and%20%60constraint.solve%60%20for%20feasibility%20analysis.%20Double-check%20tool%20selection%20against%20the%20workflow%20step.%0A5.%20Synthesis%20%E2%86%92%20Finish%20with%20%60reasoning.self_explain%60%20if%20transparency%20or%20self-critique%20is%20requested%0A%0ATool%20Reference%3A%0A%E2%80%A2%20%60socratic.inquire%60%3A%20Clarifies%20assumptions%2C%20evidence%2C%20action%20items%0A%E2%80%A2%20%60reasoning.router.plan%60%3A%20Produces%20multi-step%20plan%20and%20rationales%0A%E2%80%A2%20%60reasoning.selector%60%3A%20Selects%20best%20tool%20%26%20razors%20for%20single%20action%3B%20use%20when%20uncertain%20which%20tool%20to%20apply%0A%E2%80%A2%20%60abductive.hypothesize%60%3A%20Ranks%20hypotheses%2Fexperiments%3B%20pair%20with%20%60razors.apply%60%0A%E2%80%A2%20%60razors.apply%60%3A%20MDL%2FOccam%2C%20Bayesian%2C%20Sagan%2C%20Hitchens%2C%20Hanlon%2C%20and%20Popper%20filters%0A%E2%80%A2%20%60reasoning.divergent_convergent%60%3A%20Brainstorms%2C%20then%20converges%20with%20scoring%0A%E2%80%A2%20%60systems.map%60%3A%20Models%20causal%20loops%2C%20leverage%20points%2C%20stocks%2Fflows%2C%20risk%20factors%0A%E2%80%A2%20%60analogical.map%60%3A%20Applies%20structure%20from%20analogies%3B%20flags%20mismatches%0A%E2%80%A2%20%60dialectic.tas%60%3A%20Generates%20thesis%2Fantithesis%2Fsynthesis%20or%20leads%20inquiry%20into%20contentious%20topics%0A%E2%80%A2%20%60redblue.challenge%60%3A%20Adversarial%20review%2C%20risk%20assessment%20matrices%2C%20counter-guidance%0A%E2%80%A2%20%60reasoning.scientific%60%3A%20Experimental%20design%2C%20goal%20decomposition%2C%20falsifiability%20checks%0A%E2%80%A2%20%60constraint.solve%60%3A%20Feasibility%2Foptimization%20using%20Z3%2BDSL%0A%E2%80%A2%20%60exec.run%60%3A%20Executes%20JavaScript%20for%20calculations%20or%20data%20parsing%0A%E2%80%A2%20%60reasoning.self_explain%60%3A%20Explains%20reasoning%2C%20evidence%2C%20self-critique%2C%20and%20refinements%0A%0AOutput%3A%20The%20output%20must%20strictly%20conform%20to%20the%20schema.%20If%20information%20is%20missing%2C%20state%20any%20assumptions%20made%20in%20the%20notes%20or%20critique%20section.%20Be%20especially%20vigilant%20that%20the%20output%20from%20each%20tool%20is%20in%20the%20correct%20format%20and%20selected%20appropriately%20for%20the%20workflow.%0A%0AResources%3A%20doc%3A%2F%2Frazors.md%2C%20doc%3A%2F%2Fsystems-cheatsheet.md%2C%20doc%3A%2F%2Fconstraint-dsl.md%0A%0AConstraint%20DSL%3A%20JSON%20%60%24%7Bvariables%2C%20constraints%2C%20optimize%3F%7D%60%20is%20translated%20to%20Z3%20SMT-LIB%2C%20yielding%20%60%24%7Bstatus%2C%20model%7D%60.%0A%0A%23%23%20Output%20Format%0AReturned%20output%20must%20be%20a%20single%20top-level%20JSON%20object%20with%20this%20schema%3A%0A%0A%7B%0A%20%20%22meta%22%3A%20%7B%0A%20%20%20%20%22warnings%22%3A%20%5Bstring%5D%2C%20%2F%2F%20(Optional)%20Includes%20validation%20or%20other%20relevant%20warnings%0A%20%20%20%20%22source%22%3A%20%22string%22%20%20%20%20%2F%2F%20Source%20indicator%2C%20e.g.%2C%20%22fallback%22%20if%20a%20fallback%20is%20used%0A%20%20%7D%2C%0A%20%20%22summary%22%3A%20%5B%0A%20%20%20%20%2F%2F%20Ordered%20bullet-list%3A%20Strings%20briefly%20describing%20generated%20JSON%20artifacts%20for%20each%20run%20step.%0A%20%20%5D%2C%0A%20%20%22artifacts%22%3A%20%5B%0A%20%20%20%20%2F%2F%20Ordered%20list%20of%20JSON%20objects%E2%80%94one%20per%20executed%20tool%E2%80%94matching%20each%20tool's%20schema%20output.%0A%20%20%5D%2C%0A%20%20%22notes%22%3A%20%5Bstring%5D%20%2F%2F%20(Optional)%20Explanations%2C%20missing%20data%20assumptions%2C%20self-critique%2C%20or%20synthesis%20if%20required%20via%20%22reasoning.self_explain%22%0A%7D%0A%0A%E2%80%94%20All%20fields%20are%20required%20except%20those%20marked%20as%20Optional.%0A%E2%80%94%20Artifacts%20and%20summaries%20must%20maintain%20execution%20order.%0A%E2%80%94%20Validation%20issues%20go%20into%20meta.warnings%20(and%20notes%2C%20if%20relevant).%0A%E2%80%94%20Only%20output%20responses%20using%20this%20exact%20JSON%20structure.)

This repo is a Model Context Protocol (MCP) server that bundles a planning router, seven complementary reasoning tools, reusable prompt templates, and reference resources behind a single executable. It targets MCP-compatible clients that want structured reasoning artifacts such as thesis/antithesis/synthesis reports, Socratic question trees, causal loop diagrams, or Z3-backed constraint solutions.

## Highlights

- **Router-led planning.** The `reasoning.router.plan` tool picks a sequence of reasoning modes (dialectic, Socratic, abductive, systems, red/blue, analogical, constraint, razors) with arguments and rationale using deterministic heuristics.
- **Comprehensive reasoning tools.** Dialectic, Socratic, abductive, systems thinking, red/blue challenge, analogical mapping, constraint solving, divergent/convergent synthesis, self-explanation, and the exec sandbox are all exposed as MCP tools that return strict JSON payloads.
- **Meta selection helper.** A prompt-agnostic `reasoning.selector` tool inspects any request and recommends the next reasoning mode plus the most relevant Occam/Popper-style razors.
- **Occam & falsifiability razors.** A dedicated `razors.apply` tool scores candidate explanations using MDL/Occam, Bayesian Occam, Sagan, Hitchens, Hanlon, and Popper heuristics.
- **Prompt templates.** Matching MCP prompts are registered for each tool family so clients can opt into template-driven prompting instead of direct tool calls.
- **Embedded resources.** Quick references (razors, systems thinking cheatsheet, constraint DSL) are published via MCP resources for in-client lookup.
- **Z3-backed constraint DSL.** Constraint problems are provided as JSON, validated with Zod, converted to SMT-LIB, and solved/optimized with Z3, returning structured models.
- **Multi-provider LLM support.** Integrated support for OpenRouter, OpenAI, and Anthropic APIs with intelligent fallback and response caching.
- **Response caching.** Built-in caching system reduces API calls and improves performance for repeated queries.

## Repository structure

```
reasonsuite/
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ index.ts               # Server entrypoint
│  ├─ router/router.ts       # Planning router tool
│  ├─ tools/                 # Reasoning tools (dialectic, socratic, abductive, systems, red/blue, analogical, constraint, razors)
│  ├─ prompts/               # MCP prompt templates mirroring the tools
│  ├─ lib/dsl.ts             # Constraint-model validation helpers
│  ├─ resources/             # Markdown reference docs served via MCP resources
│  └─ smoke.ts               # Offline smoke test harness
├─ bin/reasonsuite       # Executable shim
└─ dist/                     # Build output (after `npm run build`)
```

## Installation & build

Prerequisites: **Node.js ≥ 18**.

```bash
npm install
npm run build
```

The package exposes a binary entry point:

```bash
npx reasonsuite        # or ./bin/reasonsuite after chmod +x
```

## API Configuration

ReasonSuite supports multiple LLM providers with intelligent fallback and response caching. Configure your preferred provider(s) using environment variables:

### Supported Providers

1. **OpenRouter** (Recommended)
   - Access to 100+ models through a single API
   - Free tier available
   - Get your API key from [openrouter.ai/keys](https://openrouter.ai/keys)

   ```bash
   export OPENROUTER_API_KEY=your_key_here
   export OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free  # Optional, default model
   export OPENROUTER_TEMPERATURE=0.2  # Optional, default temperature
   ```

2. **OpenAI**

   ```bash
   export OPENAI_API_KEY=your_key_here
   export OPENAI_MODEL=gpt-4o-mini  # Optional, default model
   export OPENAI_TEMPERATURE=0.2   # Optional, default temperature
   ```

3. **Anthropic**

   ```bash
   export ANTHROPIC_API_KEY=your_key_here
   export ANTHROPIC_MODEL=claude-3-haiku-20240307  # Optional, default model
   export ANTHROPIC_VERSION=2023-06-01             # Optional, default version
   ```

### Provider Priority & Fallback

ReasonSuite tries providers in this order: **OpenRouter → OpenAI → Anthropic**

If a provider fails or isn't configured, it automatically falls back to the next available provider. All providers are optional - configure at least one to enable LLM-enhanced responses.

### Response Caching

ReasonSuite includes intelligent caching to reduce API costs and improve performance:

- Responses are cached for 1 hour by default
- Cache keys are generated from prompt content and token limits
- Failed requests are also cached (with shorter TTL) to avoid repeated failures
- Use the built-in cache management functions to inspect or clear the cache

### Testing Your Configuration

Test your API configuration:

```bash
node dist/test-openrouter.js
```

This will validate your API keys and test the caching functionality.

## Operating Modes

ReasonSuite can run in two modes:

### Cloud Mode (Default)

In cloud mode, ReasonSuite uses external LLM providers (OpenRouter, OpenAI, or Anthropic) to generate reasoning outputs. This mode provides:

- LLM-enhanced responses with natural language reasoning
- Intelligent fallback between multiple providers
- Response caching for performance and cost optimization
- Requires API key configuration for at least one provider

### Local Mode

In local mode, ReasonSuite runs without making external API calls and uses deterministic fallback logic for all tools. This mode provides:

- **No external API calls** - all reasoning uses built-in heuristics
- **No API keys required** - works out of the box
- **Deterministic outputs** - consistent, rule-based responses
- **Zero cost** - no API usage charges
- **Client-side reasoning** - the MCP client's model can work directly with tool schemas and deterministic outputs

Perfect for:

- Testing and development
- Running on machines without internet access
- Using with Cursor's model to handle reasoning
- Avoiding external API dependencies

#### Enabling Local Mode

Set the `REASONSUITE_LOCAL_MODE` or `LOCAL_MODE` environment variable to `true` or `1`:

**Via environment variable:**

```bash
export REASONSUITE_LOCAL_MODE=true
npm start
```

**Via MCP configuration** (in `mcp.json`):

```json
{
  "mcpServers": {
    "reasonsuite": {
      "command": "npx",
      "args": ["-y", "reasonsuite"],
      "env": {
        "REASONSUITE_LOCAL_MODE": "true"
      }
    }
  }
}
```

**For Cursor users** wanting to use Cursor's model for reasoning:

```json
{
  "mcpServers": {
    "reasonsuite": {
      "command": "npx",
      "args": ["-y", "reasonsuite"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "REASONSUITE_LOCAL_MODE": "true"
      }
    }
  }
}
```

When running in local mode, you'll see this message on startup:

```
ReasonSuite server on stdio - LOCAL MODE (deterministic fallbacks, no external LLM calls)
```

## Testing Local Mode

You can verify that local mode is working correctly by running the following tests:

### Quick Test

Create a simple test file to verify local mode is enabled:

```bash
# Create test file
cat > test-local-mode.js << 'EOF'
#!/usr/bin/env node
import { isLocalMode, directLLMSample } from "./dist/lib/llm.js";

console.log("\n=== ReasonSuite Local Mode Test ===\n");
const localEnabled = isLocalMode();
console.log(`Local Mode Status: ${localEnabled ? "✓ ENABLED" : "✗ DISABLED"}`);

if (!localEnabled) {
    console.log("Set REASONSUITE_LOCAL_MODE=true to enable local mode");
    process.exit(0);
}

const result = await directLLMSample("Test prompt", 100);
console.log(`✓ Test completed - Success: ${result?.success ? "false (expected)" : "true (expected)"}`);
console.log(`  Reason: ${result?.reason || "N/A"}`);

if (result?.reason?.includes("local mode")) {
    console.log("\n✓✓ Local mode is working correctly!");
    console.log("   No external API calls will be made.");
    console.log("   All tools will use deterministic fallback logic.");
}
EOF

# Run the test
node test-local-mode.js
```

### Comprehensive Tool Test

For a more thorough test that verifies all tools work in local mode:

```bash
# Create comprehensive test file
cat > test-tools-local-mode.js << 'EOF'
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDialectic } from "./dist/tools/dialectic.js";
import { registerSocratic } from "./dist/tools/socratic.js";
import { registerSelector } from "./dist/tools/selector.js";
import { isLocalMode } from "./dist/lib/llm.js";

console.log("\n=== ReasonSuite Local Mode Tool Test ===\n");
const localEnabled = isLocalMode();
console.log(`Local Mode: ${localEnabled ? "✓ ENABLED" : "✗ DISABLED"}`);

if (!localEnabled) {
    console.log("Enable local mode first: export REASONSUITE_LOCAL_MODE=true");
    process.exit(0);
}

// Create test server and register tools
const server = new McpServer({ name: "test-server", version: "1.0.0" });
registerDialectic(server);
registerSocratic(server);
registerSelector(server);

console.log("Testing tools in local mode...");

// Test dialectic tool
console.log("\n--- Testing dialectic.tas tool ---");
try {
    const handler = server._tools?.["dialectic.tas"]?.handler;
    const result = await handler({
        claim: "AI will replace all software engineers",
        context: "Technology industry in 2025",
        audience: "general"
    }, {});

    const parsed = JSON.parse(result.text);
    console.log("✓ Tool executed successfully");
    console.log(`  Source: ${parsed.meta?.source || "unknown"}`);
    console.log(`  Has thesis: ${!!parsed.thesis}`);
    console.log(`  Has antithesis: ${!!parsed.antithesis}`);
    console.log(`  Has synthesis: ${!!parsed.synthesis}`);
    if (parsed.meta?.warnings?.length) {
        console.log(`  Warnings: ${parsed.meta.warnings.join(", ")}`);
    }
} catch (error) {
    console.error("✗ Test failed:", error.message);
}

// Test selector tool
console.log("\n--- Testing reasoning.selector tool ---");
try {
    const handler = server._tools?.["reasoning.selector"]?.handler;
    const result = await handler({
        request: "How can we optimize our supply chain to reduce costs?",
        context: "Manufacturing company with global distribution"
    }, {});

    const parsed = JSON.parse(result.text);
    console.log("✓ Tool executed successfully");
    console.log(`  Source: ${parsed.meta?.source || "unknown"}`);
    console.log(`  Primary mode: ${parsed.primary_mode?.id || "unknown"}`);
    console.log(`  Confidence: ${parsed.primary_mode?.confidence || 0}`);
} catch (error) {
    console.error("✗ Test failed:", error.message);
}

console.log("\n✓ All tools tested successfully in local mode!");
EOF

# Run the comprehensive test
node test-tools-local-mode.js
```

### Expected Output

When local mode is working correctly, you'll see output like:

```
=== ReasonSuite Local Mode Test ===

Local Mode Status: ✓ ENABLED

✓ Test completed - Success: false (expected)
  Reason: Running in local mode - external LLM calls are disabled. Using deterministic fallback.

✓✓ Local mode is working correctly!
   No external API calls will be made.
   All tools will use deterministic fallback logic.
```

## Quick start (MCP)

Install from npm (recommended):

```bash
npm i reasonsuite
```

Or run without installing:

```bash
npx reasonsuite
```

## Add to Cursor

Install this MCP server in Cursor with one click:

[![Add to Cursor](https://cdn.jsdelivr.net/gh/cursor-tools/buttons@main/dist/add-to-cursor.svg)](cursor://mcp/install?config={"reasonsuite":{"command":"npx","args":["-y","reasonsuite"]}})

Or use this web install link:

[Install ReasonSuite MCP Server](https://cursor.com/mcp/install?config={"reasonsuite":{"command":"npx","args":["-y","reasonsuite"]}})

## Running the server

The entrypoint (`src/index.ts`) selects the transport via the `MCP_TRANSPORT` environment variable. By default it uses stdio; set `MCP_TRANSPORT=http` (and optionally `PORT`) for the Streamable HTTP transport.

```bash
# Stdio (default)
npm start

# HTTP transport on port 3333
MCP_TRANSPORT=http PORT=3333 npm start
```

After the server starts, connect with your MCP client, list the available tools/prompts, and invoke as needed. Every tool response is JSON text that downstream automation can parse.

## Configure your MCP client

### Cursor (project-level or global)

Create a `mcp.json` either in your project at `.cursor/mcp.json` or globally at `~/.cursor/mcp.json`:

**Cloud Mode (with external LLM providers):**

```json
{
  "mcpServers": {
    "reasonsuite": {
      "command": "npx",
      "args": ["-y", "reasonsuite"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "OPENROUTER_API_KEY": "your_key_here",
        "OPENAI_API_KEY": "your_key_here",
        "ANTHROPIC_API_KEY": "your_key_here"
      }
    }
  }
}
```

**Local Mode (no external API calls, uses Cursor's model):**

```json
{
  "mcpServers": {
    "reasonsuite": {
      "command": "npx",
      "args": ["-y", "reasonsuite"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "REASONSUITE_LOCAL_MODE": "true"
      }
    }
  }
}
```

If you installed locally, you can reference the binary directly:

```json
{
  "mcpServers": {
    "reasonsuite": {
      "command": "./node_modules/.bin/reasonsuite",
      "env": { "MCP_TRANSPORT": "stdio" }
    }
  }
}
```

### Claude Desktop

Open the configuration file via Settings → Extensions → Model Context Protocol → Edit configuration. Add:

```json
{
  "mcpServers": {
    "reasonsuite": {
      "command": "npx",
      "args": ["-y", "reasonsuite"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "OPENROUTER_API_KEY": "your_key_here",
        "OPENAI_API_KEY": "your_key_here",
        "ANTHROPIC_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Optional: HTTP transport

ReasonSuite also supports the HTTP transport. Configure your client to launch the server with HTTP and a port:

```json
{
  "mcpServers": {
    "reasonsuite-http": {
      "command": "npx",
      "args": ["-y", "reasonsuite"],
      "env": { "MCP_TRANSPORT": "http", "PORT": "3333" }
    }
  }
}
```

Then point your MCP client at `http://localhost:3333` if required by the client.

## Available tools

All tools use deterministic heuristics and return structured JSON with `"source": "fallback"` in metadata - this is expected behavior.

| Tool ID                 | Description                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `reasoning.router.plan` | Plan a sequence of reasoning modes with arguments and rationale using deterministic heuristics.                   |
| `reasoning.selector`    | Recommend the most suitable reasoning mode plus supporting razors for a given request.                              |
| `dialectic.tas`         | Produce thesis, antithesis, synthesis, and open questions for a claim.                                              |
| `socratic.inquire`      | Generate multi-layer Socratic question trees plus assumptions, evidence, and next actions.                          |
| `abductive.hypothesize` | Generate and score candidate hypotheses, optionally applying razors.                                                |
| `razors.apply`          | Apply Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, and Popper tests to candidate explanations.               |
| `systems.map`           | Build causal loop diagrams with loops, leverage points, stock/flow hints, assumptions, and risks.                   |
| `redblue.challenge`     | Run adversarial red-team vs. blue-team critiques with transcripts, defects, and risk matrix.                        |
| `analogical.map`        | Map structural analogies between domains, surfacing correspondences and transfer risks.                             |
| `constraint.solve`      | Solve or optimize constraint problems expressed in the JSON mini-DSL and return Z3 models.                          |
| `exec.run`              | Execute JavaScript code in a secure VM sandbox with timeout limits.                                                |

### Tool Selection Guidelines

**Start with planning:**

- Use `reasoning.router.plan` for multi-step problems requiring several reasoning modes
- Use `reasoning.selector` for quick single-tool selection based on problem characteristics

**Core reasoning patterns:**

- **Clarification**: `socratic.inquire` → explore assumptions, scope, evidence requirements
- **Hypothesis generation**: `abductive.hypothesize` → generate explanations for uncertain situations
- **Option evaluation**: `razors.apply` → filter ideas using logical heuristics (always use after hypothesis generation)
- **Systems analysis**: `systems.map` → model feedback loops and leverage points
- **Risk assessment**: `redblue.challenge` → adversarial testing for safety/security concerns
- **Analogical reasoning**: `analogical.map` → transfer insights from similar domains
- **Debate analysis**: `dialectic.tas` → examine opposing viewpoints and synthesis
- **Optimization**: `constraint.solve` → solve constraint satisfaction and optimization problems
- **Computation**: `exec.run` → calculations, data processing, quick prototypes

**Typical workflows:**

1. **Diagnostic**: `socratic.inquire` → `abductive.hypothesize` → `razors.apply`
2. **Decision-making**: `reasoning.router.plan` → multiple tools → `redblue.challenge`
3. **Systems thinking**: `socratic.inquire` → `systems.map` → `constraint.solve`
4. **Creative problem-solving**: `reasoning.divergent_convergent` → `razors.apply` → validation tools

## Instructional prompt (copy/paste for LLMs)

Use this prompt in your LLM when connected to ReasonSuite via MCP to drive structured reasoning and artifact generation.

```text
Developer: You are connected to an MCP server named "reasonsuite," which provides structured reasoning tools.

⚠ Critical: All tools return strict JSON only—no Markdown fences are allowed. Tools must implement deterministic fallbacks (see "fallback" in the meta source). If any validation issues arise, details must go in the `meta.warnings` field of the output. The response should be a bullet-point summary of the JSON artifacts; refer to the Output Format section for precise structure.

Before beginning, provide a concise checklist (3-7 bullets) of intended sub-tasks for the workflow at hand, and take care to select the most appropriate tool(s) for each task step.

Workflow:
1. Intake → Restate goal and identify any knowledge or context gaps
2. Planning → Use `reasoning.router.plan` for multi-step tasks, `reasoning.selector` for single-tool selection. For each decision point, consider which tool is optimal for the immediate task, referencing the Tool Reference and Output Format for correct use to avoid misuse.
3. Execution → Follow the plan's step order. Pass `{request, context/priorArtifacts}` for artifact reuse. Use `abductive.hypothesize` and/or `reasoning.divergent_convergent` paired with `razors.apply` as appropriate. Carefully ensure each tool invoked is necessary and fits the purpose described in Tool Reference.
4. Risk → Apply `redblue.challenge` for safety/deployment risk analysis, `reasoning.scientific` for testing, `exec.run` for calculations, and `constraint.solve` for feasibility analysis. Double-check tool selection against the workflow step.
5. Synthesis → Finish with `reasoning.self_explain` if transparency or self-critique is requested

Tool Reference:
• `socratic.inquire`: Clarifies assumptions, evidence, action items
• `reasoning.router.plan`: Produces multi-step plan and rationales
• `reasoning.selector`: Selects best tool & razors for single action; use when uncertain which tool to apply
• `abductive.hypothesize`: Ranks hypotheses/experiments; pair with `razors.apply`
• `razors.apply`: MDL/Occam, Bayesian, Sagan, Hitchens, Hanlon, and Popper filters
• `reasoning.divergent_convergent`: Brainstorms, then converges with scoring
• `systems.map`: Models causal loops, leverage points, stocks/flows, risk factors
• `analogical.map`: Applies structure from analogies; flags mismatches
• `dialectic.tas`: Generates thesis/antithesis/synthesis or leads inquiry into contentious topics
• `redblue.challenge`: Adversarial review, risk assessment matrices, counter-guidance
• `reasoning.scientific`: Experimental design, goal decomposition, falsifiability checks
• `constraint.solve`: Feasibility/optimization using Z3+DSL
• `exec.run`: Executes JavaScript for calculations or data parsing
• `reasoning.self_explain`: Explains reasoning, evidence, self-critique, and refinements

Output: The output must strictly conform to the schema. If information is missing, state any assumptions made in the notes or critique section. Be especially vigilant that the output from each tool is in the correct format and selected appropriately for the workflow.

Resources: doc://razors.md, doc://systems-cheatsheet.md, doc://constraint-dsl.md

Constraint DSL: JSON `{variables, constraints, optimize?}` is translated to Z3 SMT-LIB, yielding `{status, model}`.

## Output Format
Returned output must be a single top-level JSON object with this schema:

{
  "meta": {
    "warnings": [string], // (Optional) Includes validation or other relevant warnings
    "source": "string"    // Source indicator, e.g., "fallback" if a fallback is used
  },
  "summary": [
    // Ordered bullet-list: Strings briefly describing generated JSON artifacts for each run step.
  ],
  "artifacts": [
    // Ordered list of JSON objects—one per executed tool—matching each tool's schema output.
  ],
  "notes": [string] // (Optional) Explanations, missing data assumptions, self-critique, or synthesis if required via "reasoning.self_explain"
}

— All fields are required except those marked as Optional.
— Artifacts and summaries must maintain execution order.
— Validation issues go into meta.warnings (and notes, if relevant).
— Only output responses using this exact JSON structure.
```

## Prompt templates

Each tool has a corresponding prompt registered under `src/prompts/`. For example, `prompts/dialectic.ts` exposes a template for thesis/antithesis/synthesis framing, while `prompts/redblue.ts` wraps the red/blue challenge configuration. Registering the server automatically publishes these prompts to MCP clients via `tools/list` and `prompts/list` endpoints.

## Embedded resources

Reference documents are served under `doc://` URIs for quick lookup inside supporting MCP clients:

- `doc://razors.md` — Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, Popper razors.
- `doc://systems-cheatsheet.md` — Feedback loops, leverage points, stocks/flows overview.
- `doc://constraint-dsl.md` — Syntax guide for the constraint mini-DSL.

## Constraint mini-DSL

Constraint problems are supplied as JSON with `{ variables, constraints, optimize? }`. Input is validated with Zod (`src/lib/dsl.ts`), ensuring variable names are well formed and duplicates are rejected. The solver assembles SMT-LIB statements, loads them into a Z3 solver/optimizer, and returns `{ status, model }` with symbolic assignments for each declared variable.

Example payload:

```json
{
  "variables": [
    { "name": "x", "type": "Int" },
    { "name": "y", "type": "Real" }
  ],
  "constraints": ["(>= x 0)", "(= y (+ x 2.5))"],
  "optimize": { "objective": "(+ x y)", "sense": "max" }
}
```

## Development & testing

ReasonSuite includes a comprehensive test system that validates all reasoning tools, logical processes, and MCP server integration patterns.

### Quick smoke test

Compile the TypeScript sources and run the basic smoke test:

```bash
npm run build
node dist/smoke.js
```

The smoke harness registers every tool against a fake MCP server, stubs LLM responses, and asserts the returned JSON parses correctly.

### Comprehensive test suite

The repository includes four levels of testing to ensure robust operation:

#### 1. Basic tool testing (`test_all_tools.js`)

Tests every tool with multiple argument permutations and validates structured JSON outputs:

```bash
node test_all_tools.js
```

- Exercises all 22 registered tools and aliases
- Tests edge cases and argument variations
- Validates JSON schema compliance
- **Result**: 44+ tool calls with full coverage

#### 2. Scenario-driven testing (`test_scenarios.js`)

Tests tools with realistic problem inputs and meaningful data:

```bash
node test_scenarios.js
```

- Uses practical problem descriptions
- Asserts presence of key output fields
- Validates tool behavior with real-world scenarios
- **Result**: 17 scenario tests covering all tool families

#### 3. Comprehensive reasoning flow testing (`test_comprehensive.js`)

Tests complete logical proof workflows and reasoning chains:

```bash
node test_comprehensive.js
```

- **Logical proof workflows**: Constraint optimization with razor validation
- **Diagnostic reasoning chains**: Socratic → Abductive → Razors → Constraint solving
- **Systems thinking approaches**: Causal mapping with red/blue stress testing
- **Unified interface validation**: All `reasoning.run` modes
- **Razor application logic**: MDL, Popper, Sagan, Hitchens criteria
- **Execution sandbox safety**: Timeout handling and result capture
- **Result**: 100% assertion pass rate on all workflow tests

#### 4. Integration testing (`test_integration.js`)

Simulates realistic LLM usage patterns with end-to-end problem solving:

```bash
node test_integration.js
```

- **Database performance problem**: 5-step reasoning workflow with router planning
- **Security incident analysis**: Multi-tool rapid response simulation
- **Capability validation**: 8 key capabilities tested
- **LLM interaction patterns**: Realistic conversation flows and tool selection
- **Result**: 100% pass rate on capability validation

### Test capabilities validated

✅ **Router Planning**: Generates multi-step reasoning plans based on problem type  
✅ **Tool Selection**: Selector chooses appropriate reasoning modes intelligently  
✅ **Logical Proofs**: Abductive reasoning generates testable hypotheses  
✅ **Razor Logic**: Filters hypotheses using MDL, Popper, Hitchens, Sagan criteria  
✅ **Constraint Solving**: Handles optimization with Z3 solver integration  
✅ **Risk Analysis**: Red/Blue challenge identifies security vulnerabilities  
✅ **Unified Interface**: `reasoning.run` supports all modes seamlessly  
✅ **Self-Explanation**: Provides transparent rationale and evidence chains

### Running all tests

Execute the complete test suite:

```bash
# Run all test levels
node test_all_tools.js && \
node test_scenarios.js && \
node test_comprehensive.js && \
node test_integration.js

# Or individual test suites
node test_comprehensive.js  # Most thorough workflow testing
node test_integration.js    # LLM usage simulation
```

The test system proves that ReasonSuite works correctly for LLMs to choose appropriate reasoning tools, apply logical razors, execute multi-step workflows, and generate structured outputs suitable for downstream processing.

## License

Unlicense. See [`LICENSE`](LICENSE).
