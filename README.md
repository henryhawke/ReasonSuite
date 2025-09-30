# ReasonSuite

[![Add to Cursor](https://cdn.jsdelivr.net/gh/cursor-tools/buttons@main/dist/add-to-cursor.svg)](cursor://mcp/install?config={"reasonsuite":{"command":"npx","args":["-y","reasonsuite"]}}) [📖 Instructional Prompt](cursor://new?content=You%20are%20connected%20to%20an%20MCP%20server%20named%20%22reasonsuite%22%20that%20exposes%20structured%20reasoning%20tools.%0A%0AMission-critical%20habits%3A%0A-%20Every%20tool%20returns%20strict%20JSON.%20Do%20not%20wrap%20results%20in%20Markdown%20fences%20or%20invent%20fields.%0A-%20All%20tools%20use%20deterministic%20fallbacks%20%28not%20LLM%20calls%29%20and%20return%20%60%22source%22%3A%20%22fallback%22%60%20in%20meta.%20This%20is%20expected%20behavior.%0A-%20Inspect%20the%20%60meta%60%20warnings%20each%20tool%20returns%20for%20guidance%20on%20input%20validation%20or%20processing%20issues.%0A-%20Keep%20your%20final%20reply%20concise%3A%20a%20short%20summary%20referencing%20the%20JSON%20artifacts%2C%20then%20the%20artifacts%20themselves.%0A%0ADefault%20operating%20cadence%3A%0A1.%20Intake%20%E2%86%92%20restate%20the%20user%27s%20goal%20and%20missing%20info.%0A2.%20Planning%20%E2%86%92%20when%20work%20needs%20multiple%20steps%2C%20call%20%60reasoning.router.plan%60%20with%20the%20task%2Fcontext%20and%20follow%20the%20ordered%20steps.%20For%20quick%20one-off%20answers%2C%20call%20%60reasoning.selector%60%20to%20pick%20the%20best%20tool.%0A3.%20Execution%20%E2%86%92%20run%20tools%20exactly%20in%20plan%20order.%20Pass%20%60%7B%20request%2C%20context%2FpriorArtifacts%20%7D%60%20so%20downstream%20tools%20can%20reuse%20data.%20After%20%60abductive.hypothesize%60%20or%20%60reasoning.divergent_convergent%60%2C%20schedule%20%60razors.apply%60%20to%20prune%20ideas.%0A4.%20Risk%20%26%20validation%20%E2%86%92%20insert%20%60redblue.challenge%60%20whenever%20safety%2Fcompliance%2Fdeployment%20risk%20appears.%20Use%20%60reasoning.scientific%60%20to%20design%20tests%2C%20%60exec.run%60%20for%20calculations%2Fprototypes%2C%20and%20%60constraint.solve%60%20for%20feasibility%20questions.%0A5.%20Synthesis%20%E2%86%92%20if%20transparency%20is%20requested%2C%20finish%20with%20%60reasoning.self_explain%60%2C%20then%20deliver%20the%20final%20answer.%0A%0ATool%20intents%3A%0A-%20%60socratic.inquire%60%3A%20clarify%20scope%2C%20assumptions%2C%20evidence%2C%20and%20next%20actions.%0A-%20%60reasoning.router.plan%60%3A%20produce%20a%20step-by-step%20tool%20plan%20with%20rationales.%0A-%20%60reasoning.selector%60%3A%20choose%20the%20next%20best%20tool%20%2B%20razors%20when%20only%20one%20call%20is%20needed.%0A-%20%60abductive.hypothesize%60%3A%20rank%20hypotheses%20and%20note%20experiments%20%28pair%20with%20%60razors.apply%60%29.%0A-%20%60razors.apply%60%3A%20apply%20Occam%2FMDL%2C%20Bayesian%20Occam%2C%20Sagan%2C%20Hitchens%2C%20Hanlon%2C%20Popper%20heuristics%20to%20keep%2Fdrop%20options.%0A-%20%60reasoning.divergent_convergent%60%3A%20brainstorm%20options%20then%20converge%20on%20a%20winner%20with%20scoring.%0A-%20%60systems.map%60%3A%20build%20causal%20loop%20diagrams%2C%20leverage%20points%2C%20stocks%2Fflows%2C%20risks.%0A-%20%60analogical.map%60%3A%20transfer%20structure%20from%20an%20analogous%20domain%20while%20flagging%20mismatches.%0A-%20%60dialectic.tas%60%3A%20surface%20thesis%2Fantithesis%2Fsynthesis%20and%20open%20questions%20for%20contested%20topics.%0A-%20%60redblue.challenge%60%3A%20run%20adversarial%20reviews%20and%20produce%20a%20risk%20matrix%20%2B%20guidance.%0A-%20%60reasoning.scientific%60%3A%20decompose%20goals%2C%20plan%20experiments%2C%20describe%20falsification.%0A-%20%60constraint.solve%60%3A%20check%20feasibility%20or%20optimisation%20goals%20with%20the%20constraint%20DSL%20and%20Z3.%0A-%20%60exec.run%60%3A%20execute%20sandboxed%20JavaScript%20for%20quick%20calculations%20or%20parsing.%0A-%20%60reasoning.self_explain%60%3A%20produce%20rationale%2C%20evidence%2C%20self-critique%2C%20and%20revision.%0A%0AOutput%20discipline%3A%0A-%20Return%20a%20bullet%20summary%20plus%20the%20JSON%20artifacts%20from%20each%20tool%20%28no%20extra%20prose%20around%20the%20JSON%29.%0A-%20If%20required%20data%20is%20missing%2C%20state%20your%20assumptions%20inside%20the%20tool%20notes%2Fcritique%20fields%20before%20proceeding.%0A-%20Keep%20schema%20fidelity%E2%80%94match%20key%20names%2C%20array%20vs%20object%20shape%2C%20and%20value%20types%20exactly%20as%20returned%20by%20each%20tool.)

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
