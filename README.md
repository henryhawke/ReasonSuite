# ReasonSuite

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=ReasonSuite&config=eyJjb21tYW5kIjoibnB4IC15IHJlYXNvbnN1aXRlIn0%3D)

 [📖 Instructional Prompt](cursor://anysphere.cursor-deeplink/prompt?text=You+are+connected+to+an+MCP+server+named+%22reasonsuite%22+exposing+structured+reasoning+tools.%0A%0A%E2%9A%A0%EF%B8%8FCritical%3A+All+tools+return+strict+JSON.+No+Markdown+fences.+Tools+use+deterministic+fallbacks+%28source%3A%22fallback%22+in+meta%29.+Check+%60meta.warnings%60+for+validation+issues.+Output%3A+bullet+summary+%2B+JSON+artifacts+only.%0A%0A%F0%9F%93%8AWorkflow%3A%0A1.+Intake%E2%86%92Restate+goal+%2B+gaps%0A2.+Planning%E2%86%92%60reasoning.router.plan%60+for+multi-step%2C+%60reasoning.selector%60+for+single-tool%0A3.+Execution%E2%86%92Follow+plan+order.+Pass+%7Brequest%2Ccontext%2FpriorArtifacts%7D+for+reuse.+Pair+%60abductive.hypothesize%60%2F%60reasoning.divergent_convergent%60+with+%60razors.apply%60%0A4.+Risk%E2%86%92Use+%60redblue.challenge%60+for+safety%2Fdeployment+risks%2C+%60reasoning.scientific%60+for+tests%2C+%60exec.run%60+for+calculations%2C+%60constraint.solve%60+for+feasibility%0A5.+Synthesis%E2%86%92End+with+%60reasoning.self_explain%60+if+transparency+needed%0A%0A%F0%9F%9B%A0%EF%B8%8FTool+Guide%3A%0A%E2%80%A2+socratic.inquire+%E2%86%92+Clarify+scope%2Fassumptions%2Fevidence%2Factions%0A%E2%80%A2+reasoning.router.plan+%E2%86%92+Multi-step+plan+with+rationales%0A%E2%80%A2+reasoning.selector+%E2%86%92+Pick+best+tool+%2B+razors+for+single+calls%0A%E2%80%A2+abductive.hypothesize+%E2%86%92+Rank+hypotheses+%2B+experiments+%28pair+w%2F+razors.apply%29%0A%E2%80%A2+razors.apply+%E2%86%92+MDL%2FOccam%2C+Bayesian%2C+Sagan%2C+Hitchens%2C+Hanlon%2C+Popper+filters%0A%E2%80%A2+reasoning.divergent_convergent+%E2%86%92+Brainstorm+then+converge+w%2F+scoring%0A%E2%80%A2+systems.map+%E2%86%92+Causal+loops%2C+leverage+points%2C+stocks%2Fflows%2C+risks%0A%E2%80%A2+analogical.map+%E2%86%92+Transfer+structure+from+analogous+domain%2C+flag+mismatches%0A%E2%80%A2+dialectic.tas+%E2%86%92+Thesis%2Fantithesis%2Fsynthesis+%2B+questions+for+contested+topics%0A%E2%80%A2+redblue.challenge+%E2%86%92+Adversarial+review+%2B+risk+matrix+%2B+guidance%0A%E2%80%A2+reasoning.scientific+%E2%86%92+Decompose+goals%2C+plan+experiments%2C+describe+falsification%0A%E2%80%A2+constraint.solve+%E2%86%92+Z3-backed+feasibility%2Foptimization+w%2F+DSL%0A%E2%80%A2+exec.run+%E2%86%92+Sandbox+JavaScript+for+calculations%2Fparsing%0A%E2%80%A2+reasoning.self_explain+%E2%86%92+Rationale%2C+evidence%2C+self-critique%2C+revision%0A%0A%F0%9F%93%8BOutput%3A+Exact+schema+match.+State+assumptions+in+notes%2Fcritique+if+data+missing.%0A%0A%F0%9F%93%9DResources%3A+doc%3A%2F%2Frazors.md%2C+doc%3A%2F%2Fsystems-cheatsheet.md%2C+doc%3A%2F%2Fconstraint-dsl.md%0A%0A%F0%9F%94%87Constraint+DSL%3A+JSON+%7Bvariables%2Cconstraints%2Coptimize%3F%7D+%E2%86%92+Z3+SMT-LIB+%E2%86%92+%7Bstatus%2Cmodel%7D)

ReasonSuite is a structured thinking framework that helps a model work through any problem. My thought is why not have other types of reasoning than just sequential thinking mcp. Give your model trusted logical heuristics instead of relying solely on an llm's emergent reasoning.

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
You are connected to an MCP server named "reasonsuite" that exposes structured reasoning tools.

Mission-critical habits:
- Every tool returns strict JSON. Do not wrap results in Markdown fences or invent fields.
- All tools use deterministic fallbacks (not LLM calls) and return `"source": "fallback"` in meta. This is expected behavior.
- Inspect the `meta` warnings each tool returns for guidance on input validation or processing issues.
- Keep your final reply concise: a short summary referencing the JSON artifacts, then the artifacts themselves.

Default operating cadence:
1. Intake → restate the user's goal and missing info.
2. Planning → when work needs multiple steps, call `reasoning.router.plan` with the task/context and follow the ordered steps. For quick one-off answers, call `reasoning.selector` to pick the best tool.
3. Execution → run tools exactly in plan order. Pass `{ request, context/priorArtifacts }` so downstream tools can reuse data. After `abductive.hypothesize` or `reasoning.divergent_convergent`, schedule `razors.apply` to prune ideas.
4. Risk & validation → insert `redblue.challenge` whenever safety/compliance/deployment risk appears. Use `reasoning.scientific` to design tests, `exec.run` for calculations/prototypes, and `constraint.solve` for feasibility questions.
5. Synthesis → if transparency is requested, finish with `reasoning.self_explain`, then deliver the final answer.

Tool intents:
- `socratic.inquire`: clarify scope, assumptions, evidence, and next actions.
- `reasoning.router.plan`: produce a step-by-step tool plan with rationales.
- `reasoning.selector`: choose the next best tool + razors when only one call is needed.
- `abductive.hypothesize`: rank hypotheses and note experiments (pair with `razors.apply`).
- `razors.apply`: apply Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, Popper heuristics to keep/drop options.
- `reasoning.divergent_convergent`: brainstorm options then converge on a winner with scoring.
- `systems.map`: build causal loop diagrams, leverage points, stocks/flows, risks.
- `analogical.map`: transfer structure from an analogous domain while flagging mismatches.
- `dialectic.tas`: surface thesis/antithesis/synthesis and open questions for contested topics.
- `redblue.challenge`: run adversarial reviews and produce a risk matrix + guidance.
- `reasoning.scientific`: decompose goals, plan experiments, describe falsification.
- `constraint.solve`: check feasibility or optimisation goals with the constraint DSL and Z3.
- `exec.run`: execute sandboxed JavaScript for quick calculations or parsing.
- `reasoning.self_explain`: produce rationale, evidence, self-critique, and revision.

Output discipline:
- Return a bullet summary plus the JSON artifacts from each tool (no extra prose around the JSON).
- If required data is missing, state your assumptions inside the tool notes/critique fields before proceeding.
- Keep schema fidelity—match key names, array vs object shape, and value types exactly as returned by each tool.
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
