# ReasonSuite

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=ReasonSuite&config=eyJjb21tYW5kIjoibnB4IC15IHJlYXNvbnN1aXRlIn0%3D)

 [📖 Instructional Prompt](cursor://anysphere.cursor-deeplink/prompt?text=You+are+connected+to+an+MCP+server+named+%22reasonsuite%22+that+exposes+structured+reasoning+tools.%0A%0AMission-critical+habits%3A%0A-+Every+tool+returns+strict+JSON.+Do+not+wrap+results+in+Markdown+fences+or+invent+fields.%0A-+All+tools+use+deterministic+fallbacks+%28not+LLM+calls%29+and+return+%60%22source%22%3A+%22fallback%22%60+in+meta.+This+is+expected+behavior.%0A-+Inspect+the+%60meta%60+warnings+each+tool+returns+for+guidance+on+input+validation+or+processing+issues.%0A-+Keep+your+final+reply+concise%3A+a+short+summary+referencing+the+JSON+artifacts%2C+then+the+artifacts+themselves.%0A%0ADefault+operating+cadence%3A%0A1.+Intake+%E2%86%92+restate+the+user%27s+goal+and+missing+info.%0A2.+Planning+%E2%86%92+when+work+needs+multiple+steps%2C+call+%60reasoning.router.plan%60+with+the+task%2Fcontext+and+follow+the+ordered+steps.+For+quick+one-off+answers%2C+call+%60reasoning.selector%60+to+pick+the+best+tool.%0A3.+Execution+%E2%86%92+run+tools+exactly+in+plan+order.+Pass+%60%7B+request%2C+context%2FpriorArtifacts+%7D%60+so+downstream+tools+can+reuse+data.+After+%60abductive.hypothesize%60+or+%60reasoning.divergent_convergent%60%2C+schedule+%60razors.apply%60+to+prune+ideas.%0A4.+Risk+%26+validation+%E2%86%92+insert+%60redblue.challenge%60+whenever+safety%2Fcompliance%2Fdeployment+risk+appears.+Use+%60reasoning.scientific%60+to+design+tests%2C+%60exec.run%60+for+calculations%2Fprototypes%2C+and+%60constraint.solve%60+for+feasibility+questions.%0A5.+Synthesis+%E2%86%92+if+transparency+is+requested%2C+finish+with+%60reasoning.self_explain%60%2C+then+deliver+the+final+answer.%0A%0ATool+intents%3A%0A-+%60socratic.inquire%60%3A+clarify+scope%2C+assumptions%2C+evidence%2C+and+next+actions.%0A-+%60reasoning.router.plan%60%3A+produce+a+step-by-step+tool+plan+with+rationales.%0A-+%60reasoning.selector%60%3A+choose+the+next+best+tool+%2B+razors+when+only+one+call+is+needed.%0A-+%60abductive.hypothesize%60%3A+rank+hypotheses+and+note+experiments+%28pair+with+%60razors.apply%60%29.%0A-+%60razors.apply%60%3A+apply+Occam%2FMDL%2C+Bayesian+Occam%2C+Sagan%2C+Hitchens%2C+Hanlon%2C+Popper+heuristics+to+keep%2Fdrop+options.%0A-+%60reasoning.divergent_convergent%60%3A+brainstorm+options+then+converge+on+a+winner+with+scoring.%0A-+%60systems.map%60%3A+build+causal+loop+diagrams%2C+leverage+points%2C+stocks%2Fflows%2C+risks.%0A-+%60analogical.map%60%3A+transfer+structure+from+an+analogous+domain+while+flagging+mismatches.%0A-+%60dialectic.tas%60%3A+surface+thesis%2Fantithesis%2Fsynthesis+and+open+questions+for+contested+topics.%0A-+%60redblue.challenge%60%3A+run+adversarial+reviews+and+produce+a+risk+matrix+%2B+guidance.%0A-+%60reasoning.scientific%60%3A+decompose+goals%2C+plan+experiments%2C+describe+falsification.%0A-+%60constraint.solve%60%3A+check+feasibility+or+optimisation+goals+with+the+constraint+DSL+and+Z3.%0A-+%60exec.run%60%3A+execute+sandboxed+JavaScript+for+quick+calculations+or+parsing.%0A-+%60reasoning.self_explain%60%3A+produce+rationale%2C+evidence%2C+self-critique%2C+and+revision.%0A%0AOutput+discipline%3A%0A-+Return+a+bullet+summary+plus+the+JSON+artifacts+from+each+tool+%28no+extra+prose+around+the+JSON%29.%0A-+If+required+data+is+missing%2C+state+your+assumptions+inside+the+tool+notes%2Fcritique+fields+before+proceeding.%0A-+Keep+schema+fidelity%E2%80%94match+key+names%2C+array+vs+object+shape%2C+and+value+types+exactly+as+returned+by+each+tool.%0A%60%60%60%0A%0A%23%23+Prompt+templates%0A%0AEach+tool+has+a+corresponding+prompt+registered+under+%60src%2Fprompts%2F%60.+For+example%2C+%60prompts%2Fdialectic.ts%60+exposes+a+template+for+thesis%2Fantithesis%2Fsynthesis+framing%2C+while+%60prompts%2Fredblue.ts%60+wraps+the+red%2Fblue+challenge+configuration.+Registering+the+server+automatically+publishes+these+prompts+to+MCP+clients+via+%60tools%2Flist%60+and+%60prompts%2Flist%60+endpoints.%0A%0A%23%23+Embedded+resources%0A%0AReference+documents+are+served+under+%60doc%3A%2F%2F%60+URIs+for+quick+lookup+inside+supporting+MCP+clients%3A%0A%0A-+%60doc%3A%2F%2Frazors.md%60+%E2%80%94+Occam%2FMDL%2C+Bayesian+Occam%2C+Sagan%2C+Hitchens%2C+Hanlon%2C+Popper+razors.%0A-+%60doc%3A%2F%2Fsystems-cheatsheet.md%60+%E2%80%94+Feedback+loops%2C+leverage+points%2C+stocks%2Fflows+overview.%0A-+%60doc%3A%2F%2Fconstraint-dsl.md%60+%E2%80%94+Syntax+guide+for+the+constraint+mini-DSL.%0A%0A%23%23+Constraint+mini-DSL%0A%0AConstraint+problems+are+supplied+as+JSON+with+%60%7B+variables%2C+constraints%2C+optimize%3F+%7D%60.+Input+is+validated+with+Zod+%28%60src%2Flib%2Fdsl.ts%60%29%2C+ensuring+variable+names+are+well+formed+and+duplicates+are+rejected.+The+solver+assembles+SMT-LIB+statements%2C+loads+them+into+a+Z3+solver%2Foptimizer%2C+and+returns+%60%7B+status%2C+model+%7D%60+with+symbolic+assignments+for+each+declared+variable.%0A%0AExample+payload%3A%0A%0A%60%60%60json%0A%7B%0A++%22variables%22%3A+%5B%0A++++%7B+%22name%22%3A+%22x%22%2C+%22type%22%3A+%22Int%22+%7D%2C%0A++++%7B+%22name%22%3A+%22y%22%2C+%22type%22%3A+%22Real%22+%7D%0A++%5D%2C%0A++%22constraints%22%3A+%5B%22%28%3E%3D+x+0%29%22%2C+%22%28%3D+y+%28%2B+x+2.5%29%29%22%5D%2C%0A++%22optimize%22%3A+%7B+%22objective%22%3A+%22%28%2B+x+y%29%22%2C+%22sense%22%3A+%22max%22+%7D%0A%7D%0A%60%60%60)

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
