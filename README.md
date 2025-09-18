# ReasonSuite MCP

ReasonSuite MCP is a Model Context Protocol (MCP) server that bundles a planning router, seven complementary reasoning tools, reusable prompt templates, and reference resources behind a single executable. It targets MCP-compatible clients that want structured reasoning artifacts such as thesis/antithesis/synthesis reports, Socratic question trees, causal loop diagrams, or Z3-backed constraint solutions.

## Highlights

- **Router-led planning.** The `reasoning.router.plan` tool picks a sequence of reasoning modes (dialectic, Socratic, abductive, systems, red/blue, analogical, constraint, razors) with arguments and rationale, falling back to a deterministic plan if sampling is unavailable.
- **Seven reasoning tools.** Dialectic, Socratic, abductive, systems thinking, red/blue challenge, analogical mapping, and constraint solving are all exposed as MCP tools and return strict JSON payloads suitable for downstream automation.
- **Occam & falsifiability razors.** A dedicated `razors.apply` tool scores candidate explanations using MDL/Occam, Bayesian Occam, Sagan, Hitchens, Hanlon, and Popper heuristics.
- **Prompt templates.** Matching MCP prompts are registered for each tool family so clients can opt into template-driven prompting instead of direct tool calls.
- **Embedded resources.** Quick references (razors, systems thinking cheatsheet, constraint DSL) are published via MCP resources for in-client lookup.
- **Z3-backed constraint DSL.** Constraint problems are provided as JSON, validated with Zod, converted to SMT-LIB, and solved/optimized with Z3, returning structured models.

## Repository structure

```
reason-suite-mcp/
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
├─ bin/mcp-reasonsuite       # Executable shim
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
npx mcp-reasonsuite        # or ./bin/mcp-reasonsuite after chmod +x
```

## Running the server

The entrypoint (`src/index.ts`) selects the transport via the `MCP_TRANSPORT` environment variable. By default it uses stdio; set `MCP_TRANSPORT=http` (and optionally `PORT`) for the Streamable HTTP transport.

```bash
# Stdio (default)
npm start

# HTTP transport on port 3333
MCP_TRANSPORT=http PORT=3333 npm start
```

After the server starts, connect with your MCP client, list the available tools/prompts, and invoke as needed. Every tool response is JSON text that downstream automation can parse.

## Available tools

| Tool ID | Description |
| --- | --- |
| `reasoning.router.plan` | Plan a sequence of reasoning modes with arguments and rationale, with a safe fallback when sampling is unavailable. |
| `dialectic.tas` | Produce thesis, antithesis, synthesis, and open questions for a claim. |
| `socratic.inquire` | Generate multi-layer Socratic question trees plus assumptions, evidence, and next actions. |
| `abductive.hypothesize` | Generate and score candidate hypotheses, optionally applying razors. |
| `razors.apply` | Apply Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, and Popper tests to candidate explanations. |
| `systems.map` | Build causal loop diagrams with loops, leverage points, stock/flow hints, assumptions, and risks. |
| `redblue.challenge` | Run adversarial red-team vs. blue-team critiques with transcripts, defects, and risk matrix. |
| `analogical.map` | Map structural analogies between domains, surfacing correspondences and transfer risks. |
| `constraint.solve` | Solve or optimize constraint problems expressed in the JSON mini-DSL and return Z3 models. |

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

Compile the TypeScript sources and run the offline smoke test to exercise every tool without an LLM backend:

```bash
npm run build
node dist/smoke.js
```

The smoke harness registers every tool against a fake MCP server, stubs LLM responses, and asserts the returned JSON parses correctly.

## License

MIT License. See [`LICENSE`](LICENSE).
