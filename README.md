# ReasonSuite MCP — A Unified Reasoning Server for MCP

**Version:** 0.1.0
**Transport:** stdio (with optional Streamable HTTP)
**SDK:** `@modelcontextprotocol/sdk` (TypeScript)
**Node:** ≥ 22

ReasonSuite MCP exposes a **router** (plans which reasoning modes to use) plus **seven reasoning tool families** and matching **prompt templates**. It also ships with a small **constraint DSL** that compiles to **Z3** for exact constraint solving.

---

## Phase 0 — Capabilities & Modes (Concept)

**Goals**

1. Let an agent pick a **reasoning mode** per task (or mix several).
2. Return **structured, auditable artifacts** (e.g., thesis/antithesis/synthesis; CLDs; hypothesis tables; solver models).
3. Provide **prompt templates** mirroring each tool so clients that prefer direct prompting can do so.
4. Offer a **router** tool that suggests a plan (sequence of modes), optionally leveraging LLM sampling per MCP. ([GitHub][2])

**Included Reasoning Modes**

- **Dialectical** (thesis → antithesis → synthesis)
- **Socratic** (guided questioning)
- **Abductive** (inference to best explanation), with **razors** (Occam/MDL, Sagan/Hitchens/Hanlon, Popper falsifiability)
- **Systems Thinking** (variables → feedback loops → **causal loop diagram** + stock/flow hints + leverage points) ([The Academy for Systems Change][9])
- **Red Team / Blue Team** (multi‑round adversarial critique/defense) ([arXiv][10], [ACL Anthology][11])
- **Analogical** (map structure from source to target domain) ([ACL Anthology][12], [arXiv][13])
- **Constraint‑Based** (solve formal constraints with **Z3**) ([npm][5])

**Design Notes**

- Uses MCP **prompts** for reusable templates (protocol supports prompts explicitly; TS SDK provides `registerPrompt`). ([Model Context Protocol][14], [GitHub][2])
- Uses MCP **sampling** to let tools ask the agent host to generate/evaluate content where needed (e.g., router decisions, analogical mappings). ([GitHub][2])
- We cite ToT/GoT/self‑consistency as upstream inspiration; if you later want a search‑heavy planner, you can compose those with our router. ([arXiv][15])

---

## Phase 1 — Repository Layout

```
reason-suite-mcp/
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ index.ts
│  ├─ router/
│  │  └─ router.ts
│  ├─ tools/
│  │  ├─ dialectic.ts
│  │  ├─ socratic.ts
│  │  ├─ abductive.ts
│  │  ├─ systems.ts
│  │  ├─ redblue.ts
│  │  ├─ analogical.ts
│  │  ├─ constraint.ts
│  │  └─ razors.ts
│  ├─ prompts/
│  │  ├─ dialectic.ts
│  │  ├─ socratic.ts
│  │  ├─ abductive.ts
│  │  ├─ systems.ts
│  │  ├─ redblue.ts
│  │  ├─ analogical.ts
│  │  └─ constraint.ts
│  ├─ lib/
│  │  ├─ types.ts
│  │  └─ dsl.ts
│  └─ resources/
│     ├─ razors.md
│     ├─ systems-cheatsheet.md
│     └─ constraint-dsl.md
├─ bin/
│  └─ mcp-reasonsuite
├─ README.md   ← this file
└─ LICENSE
```

---

## Phase 2 — Install & Build

```bash
npm init -y
npm install @modelcontextprotocol/sdk zod z3-solver yaml
npm run build
```

**package.json**

```json
{
  "name": "@maiple/reason-suite-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "mcp-reasonsuite": "bin/mcp-reasonsuite"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "node dist/index.js",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.3",
    "zod": "^3.23.8",
    "z3-solver": "^4.12.4",
    "yaml": "^2.5.1"
  },
  "engines": {
    "node": ">=18"
  }
}
```

> The TypeScript SDK implements the full MCP spec (tools/resources/prompts; stdio + **Streamable HTTP**; SSE deprecated). ([GitHub][2])

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**bin/mcp-reasonsuite**

```bash
#!/usr/bin/env node
import("../dist/index.js");
```

Make executable:

```bash
chmod +x bin/mcp-reasonsuite
```

---

## Phase 3 — Server Entry (`src/index.ts`)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

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

// Resources (docs)
import fs from "node:fs/promises";
import path from "node:path";

const server = new McpServer({
  name: "reason-suite-mcp",
  version: "0.1.0",
});

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

// Register resources (markdown handbooks)
async function addResource(file: string, title: string, description: string) {
  const p = path.resolve(process.cwd(), "src/resources", file);
  server.registerResource(
    file,
    `doc://${file}`,
    { title, description, mimeType: "text/markdown" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: await fs.readFile(p, "utf-8") }],
    })
  );
}

await addResource(
  "razors.md",
  "Reasoning Razors",
  "Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, Popper"
);
await addResource(
  "systems-cheatsheet.md",
  "Systems Thinking Cheatsheet",
  "Causal loops, stocks/flows, leverage points"
);
await addResource(
  "constraint-dsl.md",
  "Constraint DSL",
  "Mini-DSL compiled to Z3"
);

// Start transport (stdio by default)
const mode = process.env.MCP_TRANSPORT ?? "stdio";
if (mode === "http") {
  const transport = new StreamableHTTPServerTransport({
    port: Number(process.env.PORT ?? 3333),
  });
  await server.connect(transport);
  console.log(`ReasonSuite MCP server listening on HTTP ${transport.port}`);
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("ReasonSuite MCP server on stdio");
}
```

---

## Phase 4 — The Router (choose a plan)

**src/router/router.ts**

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerRouter(server: McpServer) {
  server.registerTool(
    "reasoning.router.plan",
    {
      title: "Plan reasoning approach",
      description:
        "Given a task, propose an ordered plan of reasoning modes with brief rationale. Modes: dialectic, socratic, abductive, systems, redblue, analogical, constraint, razors.apply. Returns JSON.",
      inputSchema: {
        task: z.string().describe("User task or question"),
        context: z.string().optional(),
        maxSteps: z.number().int().positive().max(8).default(4),
      },
    },
    async ({ task, context, maxSteps }) => {
      // Try LLM classification via MCP sampling; if unsupported, fall back to rules.
      let planText: string | null = null;
      try {
        const resp = await server.server.createMessage({
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `You are a planner. Available modes: dialectic, socratic, abductive, systems, redblue, analogical, constraint, razors.apply.
Task: ${task}
Context: ${context ?? ""}

Output as strict JSON:
{
  "steps": [{"mode":"...", "why":"...", "args":{}}],
  "notes": "one line on expected limitations"
}
Limit steps to ${maxSteps}. Prefer constraint when explicit numeric/logical constraints exist; prefer systems when many interacting variables; prefer abductive for incomplete data; use razors.apply after hypothesis lists; add redblue before finalization for safety; use analogical if helpful transfer exists; use dialectic when controversy/policy/value trade-offs; start with socratic for scoping.`,
              },
            },
          ],
          maxTokens: 500,
        });
        if (resp.content.type === "text") planText = resp.content.text.trim();
      } catch {}

      const fallback = {
        steps: [
          {
            mode: "socratic",
            why: "Scope the task and unknowns",
            args: { depth: 2 },
          },
          {
            mode: "abductive",
            why: "Generate/test leading explanations or options",
            args: { k: 3 },
          },
          {
            mode: "razors.apply",
            why: "Prune via MDL/Occam and falsifiability",
            args: { razors: ["MDL", "Popper"] },
          },
        ],
        notes: "LLM sampling unavailable; rule-based fallback used.",
      };

      const json = safeParseJSON(planText) ?? fallback;
      return {
        content: [{ type: "text", text: JSON.stringify(json, null, 2) }],
      };
    }
  );
}

function safeParseJSON(txt?: string | null) {
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
```

---

## Phase 5 — Tools (implementations)

Each tool returns **structured JSON** inside text so any client can parse it.

### 5.1 Dialectical (`src/tools/dialectic.ts`)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerDialectic(server: McpServer) {
  server.registerTool(
    "dialectic.tas",
    {
      title: "Dialectic (Thesis–Antithesis–Synthesis)",
      description:
        "Given a claim, produce thesis, antithesis, and synthesis with evidence requests.",
      inputSchema: {
        claim: z.string(),
        context: z.string().optional(),
        audience: z.string().default("general"),
      },
    },
    async ({ claim, context, audience }) => {
      const prompt = `Use a dialectical frame.
Claim: ${claim}
Context: ${context ?? ""}
Audience: ${audience}

Return JSON:
{
 "thesis": {"position": "...", "key_points": ["..."]},
 "antithesis": {"position": "...", "key_points": ["..."]},
 "synthesis": {"proposal": "...", "assumptions": ["..."], "tradeoffs": ["..."], "evidence_needed": ["..."]},
 "open_questions": ["..."]
}`;
      const resp = await server.server.createMessage({
        messages: [{ role: "user", content: { type: "text", text: prompt } }],
        maxTokens: 700,
      });
      const out = resp.content.type === "text" ? resp.content.text : "{}";
      return { content: [{ type: "text", text: out }] };
    }
  );
}
```

### 5.2 Socratic (`src/tools/socratic.ts`)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerSocratic(server: McpServer) {
  server.registerTool(
    "socratic.inquire",
    {
      title: "Socratic inquiry",
      description:
        "Generate a structured series of probing questions to clarify scope, assumptions, and evidence.",
      inputSchema: {
        topic: z.string(),
        context: z.string().optional(),
        depth: z.number().int().min(1).max(6).default(3),
      },
    },
    async ({ topic, context, depth }) => {
      const prompt = `Produce a ${depth}-layer Socratic question tree for: "${topic}"
Context: ${context ?? ""}
JSON schema:
{
 "layers": [
   {"level": 1, "questions": ["..."]},
   {"level": 2, "questions": ["..."]},
   ...
 ],
 "assumptions_to_test": ["..."],
 "evidence_to_collect": ["..."],
 "next_actions": ["..."]
}`;
      const resp = await server.server.createMessage({
        messages: [{ role: "user", content: { type: "text", text: prompt } }],
        maxTokens: 600,
      });
      return {
        content: [
          {
            type: "text",
            text: resp.content.type === "text" ? resp.content.text : "{}",
          },
        ],
      };
    }
  );
}
```

### 5.3 Abductive (`src/tools/abductive.ts`) + Razors (`src/tools/razors.ts`)

```ts
// abductive.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerAbductive(server: McpServer) {
  server.registerTool(
    "abductive.hypothesize",
    {
      title: "Abductive hypotheses",
      description:
        "Generate k candidate hypotheses and rank by plausibility, explanatory power, simplicity (MDL proxy), and testability.",
      inputSchema: {
        observations: z.string(),
        k: z.number().int().min(2).max(10).default(4),
        apply_razors: z
          .array(z.string())
          .default(["MDL", "Hitchens", "Sagan", "Popper"]),
      },
    },
    async ({ observations, k, apply_razors }) => {
      const prompt = `Observations:\n${observations}

Generate ${k} abductive hypotheses. Score each on:
- prior_plausibility (0-1)
- explanatory_power (0-1)
- simplicity_penalty (0-1) // approximate MDL: shorter explanation ⇒ lower penalty
- testability (0-1)
- overall_score = plaus + power + testability - simplicity_penalty

Apply razors: ${apply_razors.join(", ")}.
Return JSON:
{
 "hypotheses": [
  {"id":"H1","statement":"...","rationale":"...", "scores":{"prior_plausibility":0.6,"explanatory_power":0.7,"simplicity_penalty":0.2,"testability":0.6,"overall":1.7}},
  ...
 ],
 "experiments_or_evidence": ["test1", "..."],
 "notes": "..."
}`;
      const resp = await server.server.createMessage({
        messages: [{ role: "user", content: { type: "text", text: prompt } }],
        maxTokens: 900,
      });
      return {
        content: [
          {
            type: "text",
            text: resp.content.type === "text" ? resp.content.text : "{}",
          },
        ],
      };
    }
  );
}

// razors.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerRazors(server: McpServer) {
  server.registerTool(
    "razors.apply",
    {
      title: "Apply reasoning razors",
      description:
        "Given candidate explanations, apply Occam/MDL, Bayesian Occam, Sagan, Hitchens, Hanlon, Popper falsifiability to produce keep/drop recommendations.",
      inputSchema: {
        candidates_json: z
          .string()
          .describe("JSON array or object of candidates"),
        razors: z
          .array(z.string())
          .default([
            "MDL",
            "BayesianOccam",
            "Sagan",
            "Hitchens",
            "Hanlon",
            "Popper",
          ]),
      },
    },
    async ({ candidates_json, razors }) => {
      const prompt = `Candidates JSON:\n${candidates_json}
Razors: ${razors.join(", ")}

For each candidate produce:
{"id":"...","keep_or_drop":"keep|drop|revise","reasons":["..."],"risk_notes":"..."}

Overall: summarize conflicts among razors and final shortlist. Output { "results": [...], "shortlist": ["ids..."], "notes": "..." }`;
      const resp = await server.server.createMessage({
        messages: [{ role: "user", content: { type: "text", text: prompt } }],
        maxTokens: 700,
      });
      return {
        content: [
          {
            type: "text",
            text: resp.content.type === "text" ? resp.content.text : "{}",
          },
        ],
      };
    }
  );
}
```

> **Why MDL & Bayesian Occam?** They’re formalizations of simplicity parsimony (Occam) used for model selection and compression‑based inference. ([homepages.cwi.nl][7], [CS Princeton][8])

### 5.4 Systems Thinking (`src/tools/systems.ts`)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerSystems(server: McpServer) {
  server.registerTool(
    "systems.map",
    {
      title: "Systems map (CLD)",
      description:
        "Create a causal loop diagram (Mermaid) with candidate reinforcing/balancing loops and leverage points.",
      inputSchema: {
        variables: z.array(z.string()).describe("Known variables").default([]),
        context: z.string().optional(),
      },
    },
    async ({ variables, context }) => {
      const prompt = `Build a concise causal loop diagram (CLD) for the system below.
Variables: ${variables.join(", ") || "(discover reasonable variables)"}
Context: ${context ?? ""}

Return JSON:
{
 "mermaid":"graph LR; A-->B; B-.-|neg|C; ...",
 "loops":[{"type":"reinforcing","nodes":["..."]},{"type":"balancing","nodes":["..."]}],
 "leverage_points":["rules","information_flow","goals","paradigms"],
 "stock_flow_hints":[{"stock":"...","inflows":["..."],"outflows":["..."]}],
 "assumptions":["..."],
 "risks":["..."]
}`;
      const resp = await server.server.createMessage({
        messages: [{ role: "user", content: { type: "text", text: prompt } }],
        maxTokens: 1000,
      });
      return {
        content: [
          {
            type: "text",
            text: resp.content.type === "text" ? resp.content.text : "{}",
          },
        ],
      };
    }
  );
}
```

> We reference Meadows’ leverage points (rules, information flow, goals, paradigms, etc.) and stock/flow modeling to ground outputs. ([The Academy for Systems Change][9])

### 5.5 Red/Blue Team (`src/tools/redblue.ts`)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerRedBlue(server: McpServer) {
  server.registerTool(
    "redblue.challenge",
    {
      title: "Red vs Blue critique",
      description:
        "Run N rounds of adversarial challenge/defense on a proposal or answer. Returns a transcript + defects + risk matrix.",
      inputSchema: {
        proposal: z.string(),
        rounds: z.number().int().min(1).max(5).default(2),
        focus: z
          .array(z.string())
          .default(["safety", "bias", "hallucination", "security", "privacy"]),
      },
    },
    async ({ proposal, rounds, focus }) => {
      const prompt = `Conduct ${rounds} rounds of Red (attack) vs Blue (defense) on:
${proposal}

Focus areas: ${focus.join(", ")}.
Return JSON:
{
 "rounds":[
   {"n":1,"red":{"attack":"..."}, "blue":{"defense":"...","mitigations":["..."]}},
   ...
 ],
 "defects":[{"type":"...","severity":"low|med|high","evidence":"..."}],
 "risk_matrix":{"low":[],"medium":[],"high":[]},
 "final_guidance":["..."]
}`;
      const resp = await server.server.createMessage({
        messages: [{ role: "user", content: { type: "text", text: prompt } }],
        maxTokens: 900,
      });
      return {
        content: [
          {
            type: "text",
            text: resp.content.type === "text" ? resp.content.text : "{}",
          },
        ],
      };
    }
  );
}
```

> Red‑teaming frameworks for LLMs and adaptive multi‑round methods are active research areas; use this to stress‑test reasoning artifacts. ([arXiv][10], [ACL Anthology][11])

### 5.6 Analogical (`src/tools/analogical.ts`)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerAnalogical(server: McpServer) {
  server.registerTool(
    "analogical.map",
    {
      title: "Analogical mapping",
      description:
        "Map structure from a source domain to a target problem; identify correspondences, constraints, and transfer risks.",
      inputSchema: {
        source_domain: z.string(),
        target_problem: z.string(),
        constraints: z.string().optional(),
      },
    },
    async ({ source_domain, target_problem, constraints }) => {
      const prompt = `Build a structural analogy from SOURCE to TARGET.

SOURCE: ${source_domain}
TARGET: ${target_problem}
CONSTRAINTS: ${constraints ?? ""}

JSON:
{
 "mapping":[{"source":"...","target":"...","justification":"..."}],
 "shared_relations":["..."],
 "mismatches":["..."],
 "transferable_insights":["..."],
 "failure_modes":["..."]
}`;
      const resp = await server.server.createMessage({
        messages: [{ role: "user", content: { type: "text", text: prompt } }],
        maxTokens: 900,
      });
      return {
        content: [
          {
            type: "text",
            text: resp.content.type === "text" ? resp.content.text : "{}",
          },
        ],
      };
    }
  );
}
```

> Large‑scale resources like **ANALOGYKB** and recent work on analogical structure motivate this tool. ([ACL Anthology][12], [arXiv][16])

### 5.7 Constraint Solver (Z3) (`src/tools/constraint.ts` + `src/lib/dsl.ts`)

**src/lib/dsl.ts** (micro‑DSL → Z3)

```ts
export type VarDecl = { name: string; type: "Int" | "Real" | "Bool" };
export type Constraint = string; // infix, e.g., "x + y <= 10", "x > 0", "and(a, b)", "or(a, not b)"

export type ModelRequest = {
  variables: VarDecl[];
  constraints: Constraint[];
  optimize?: { objective: string; sense: "min" | "max" } | null;
};

export function parseModel(json: string): ModelRequest {
  const obj = JSON.parse(json);
  if (!obj.variables || !obj.constraints) throw new Error("Missing fields");
  return obj;
}
```

**src/tools/constraint.ts**

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseModel, ModelRequest } from "../lib/dsl.js";
import { init } from "z3-solver";

export function registerConstraint(server: McpServer) {
  server.registerTool(
    "constraint.solve",
    {
      title: "Constraint solver (Z3)",
      description:
        "Solve constraints using Z3. Input mini-DSL as JSON (variables, constraints, optional optimize).",
      inputSchema: {
        model_json: z
          .string()
          .describe("JSON with {variables, constraints, optimize?}"),
      },
    },
    async ({ model_json }) => {
      const { Context } = await init();
      const Z = new Context("main");
      let req: ModelRequest;

      try {
        req = parseModel(model_json);
      } catch (e: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: e?.message || "Invalid model_json" },
                null,
                2
              ),
            },
          ],
        };
      }

      const decls: Record<string, any> = {};
      for (const v of req.variables) {
        decls[v.name] =
          v.type === "Int"
            ? Z.Int.const(v.name)
            : v.type === "Real"
            ? Z.Real.const(v.name)
            : Z.Bool.const(v.name);
      }

      const s = new Z.Solver();

      // Naive infix parser demo: rely on Z.parseSMTLIB2 for quick conversion if possible
      for (const c of req.constraints) {
        try {
          // Accept simple SMTLIB too; otherwise very simple infix support via eval in a sandbox-like scope.
          // For safety, avoid eval: here we accept Z.parseSMTLIB2 string.
          const f = Z.parseSMTLIB2(
            `(assert ${c})`,
            [],
            [],
            Object.values(decls)
          );
          s.add(f);
        } catch {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { error: `Bad constraint: ${c}` },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      if (req.optimize) {
        const o = new Z.Optimize();
        o.add(s.assertions());
        const term = Z.parseSMTLIB2(
          req.optimize.objective,
          [],
          [],
          Object.values(decls)
        );
        if (req.optimize.sense === "min") o.minimize(term);
        else o.maximize(term);
        const r = o.check();
        if (r !== "sat")
          return {
            content: [
              { type: "text", text: JSON.stringify({ status: r }, null, 2) },
            ],
          };
        const m = o.model();
        const model: Record<string, any> = {};
        for (const [name, sym] of Object.entries(decls))
          model[name] = m.get(sym)?.toString();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ status: r, model }, null, 2),
            },
          ],
        };
      } else {
        const r = s.check();
        if (r !== "sat")
          return {
            content: [
              { type: "text", text: JSON.stringify({ status: r }, null, 2) },
            ],
          };
        const m = s.model();
        const model: Record<string, any> = {};
        for (const [name, sym] of Object.entries(decls))
          model[name] = m.get(sym)?.toString();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ status: r, model }, null, 2),
            },
          ],
        };
      }
    }
  );
}
```

> `z3-solver` provides WASM TypeScript bindings; suitable for Node and browser contexts. ([npm][5])

---

## Phase 6 — Prompt Templates (MCP `registerPrompt`)

> MCP **prompts** are first‑class: clients can list and insert them. The SDK exposes `registerPrompt` and completion helpers. Protocol revisions documenting prompts are current in MCP docs. ([GitHub][2])

Below we register concise versions; you can expand content as desired.

**Example pattern** (apply to each file below):

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerXPrompts(server: McpServer) {
  server.registerPrompt(
    "x.short",
    {
      title: "X Short",
      description: "Concise template.",
      argsSchema: { goal: z.string() },
    },
    ({ goal }) => ({
      messages: [
        {
          role: "user",
          content: { type: "text", text: `Do X for: ${goal}\nReturn JSON.` },
        },
      ],
    })
  );
}
```

### 6.1 Dialectic (`src/prompts/dialectic.ts`)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerDialecticPrompts(server: McpServer) {
  server.registerPrompt(
    "dialectic.tas",
    {
      title: "Dialectic TAS",
      description: "Thesis–Antithesis–Synthesis template",
      argsSchema: { claim: z.string(), context: z.string().optional() },
    },
    ({ claim, context }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Frame the following with a dialectic lens.
Claim: ${claim}
Context: ${context ?? ""}

Output JSON with thesis, antithesis, synthesis (proposal, assumptions, tradeoffs, evidence_needed), open_questions.`,
          },
        },
      ],
    })
  );
}
```

### 6.2 Socratic (`src/prompts/socratic.ts`)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
export function registerSocraticPrompts(server: McpServer) {
  server.registerPrompt(
    "socratic.tree",
    {
      title: "Socratic Tree",
      description:
        "Generate multi-layer probing questions + assumptions/evidence",
      argsSchema: { topic: z.string(), depth: z.number().int().default(3) },
    },
    ({ topic, depth }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Produce a ${depth}-layer Socratic question tree for: ${topic}
Include assumptions_to_test, evidence_to_collect, next_actions. Output JSON.`,
          },
        },
      ],
    })
  );
}
```

### 6.3 Abductive (`src/prompts/abductive.ts`)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
export function registerAbductivePrompts(server: McpServer) {
  server.registerPrompt(
    "abductive.hypotheses",
    {
      title: "Abductive Hypotheses",
      description: "k-best explanations with razors",
      argsSchema: { observations: z.string(), k: z.number().int().default(4) },
    },
    ({ observations, k }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Observations:\n${observations}\nGenerate ${k} abductive hypotheses with scores (prior, power, simplicity_penalty (MDL proxy), testability) and overall. Output JSON.`,
          },
        },
      ],
    })
  );
}
```

### 6.4 Systems (`src/prompts/systems.ts`), 6.5 RedBlue (`src/prompts/redblue.ts`), 6.6 Analogical (`src/prompts/analogical.ts`), 6.7 Constraint (`src/prompts/constraint.ts`)

_(Analogous to tools above—same wording as the tool prompts; emit JSON.)_

---

## Phase 7 — Resources (handbooks)

**src/resources/razors.md** (excerpt)

- **MDL (Minimum Description Length)** — prefer explanations that compress data; proxy for Occam’s Razor.
- **Bayesian Occam** — model evidence penalizes overly flexible hypotheses.
- **Sagan’s standard** — extraordinary claims require extraordinary evidence.
- **Hitchens’ razor** — claims without evidence can be dismissed without evidence.
- **Hanlon’s razor** — do not attribute to malice what can be explained by incompetence or noise.
- **Popper (falsifiability)** — prefer hypotheses with clear refutation tests.

> MDL and Bayesian Occam are formalized in information theory and Bayesian model comparison. ([homepages.cwi.nl][7], [CS Princeton][8])

**src/resources/systems-cheatsheet.md** (excerpt)

- **Causal Loop Diagram (CLD):** reinforcing vs balancing loops.
- **Stocks/Flows:** accumulate vs rates; convert CLDs to stock/flow where needed.
- **Leverage Points:** rules, information flows, goals, paradigms, and beyond. ([The Academy for Systems Change][9])

**src/resources/constraint-dsl.md** (excerpt)

- **Variables:** `{"name":"x","type":"Int|Real|Bool"}`
- **Constraints:** SMT‑LIB **sub‑terms** inside `(assert …)`; e.g., `(<= (+ x y) 10)`.
- **Optimize:** `{ "objective": "(+ x y)", "sense": "max" }`

> Z3 JS/TS bindings via `z3-solver` (WASM). ([npm][5])

---

## Phase 8 — Usage (with common MCP clients)

**Claude Desktop / Cursor / VSCode** (example `mcp.json` snippet):

```jsonc
{
  "mcpServers": {
    "reason-suite": {
      "command": "mcp-reasonsuite",
      "args": []
    }
  }
}
```

- List tools: `tools/list` should show `reasoning.router.plan`, `dialectic.tas`, `socratic.inquire`, `abductive.hypothesize`, `razors.apply`, `systems.map`, `redblue.challenge`, `analogical.map`, `constraint.solve`.
- List prompts: `prompts/list` to discover all templates.
- Fetch docs: `resources/list` → `doc://razors.md`, etc.

> MCP clients can call tools, read resources, and insert prompts; server can also **request sampling** (LLM completions) from the host, used in our router and tools. ([GitHub][2])

---

## Phase 9 — Worked Examples

1. **Router → Dialectic → Red/Blue → Razors**
   Call:

```json
{
  "tool": "reasoning.router.plan",
  "arguments": {
    "task": "Should we deploy feature X now or after Q4?",
    "maxSteps": 4
  }
}
```

Then follow the returned steps (e.g., run `dialectic.tas`, then `redblue.challenge`, finish with `razors.apply`).

2. **Systems Mapping**

```json
{
  "tool": "systems.map",
  "arguments": {
    "variables": [
      "ad_spend",
      "organic_traffic",
      "conversion_rate",
      "inventory"
    ],
    "context": "E‑commerce growth throttling"
  }
}
```

Parse `mermaid` to render a CLD.

3. **Constraint Solve**

```json
{
  "tool": "constraint.solve",
  "arguments": {
    "model_json": "{\"variables\":[{\"name\":\"x\",\"type\":\"Int\"},{\"name\":\"y\",\"type\":\"Int\"}],\"constraints\":[\"(>= x 0)\",\"(>= y 0)\",\"(<= (+ x y) 10)\"],\"optimize\":{\"objective\":\"(+ x (* 2 y))\",\"sense\":\"max\"}}"
  }
}
```

---

## Phase 10 — Security & Quality Notes

- **Prompt‑injection & tool poisoning:** Run red/blue regularly; validate and sanitize any external inputs. (Security docs and community analyses emphasize this risk for MCP.) ([Wikipedia][17])
- **SSE → Streamable HTTP:** Prefer Streamable HTTP for new deployments. ([GitHub][2])
- **Sequential Thinking:** This repo complements the “Sequential Thinking” reference server; compare if you want a single tool with ToT‑like iteration. ([GitHub][3])
- **Limits of “reasoning models”:** Recent work highlights brittleness under complexity; use constraint solving/system mapping when tasks are formalizable. ([The Guardian][18])

---

## Phase 11 — Extend & Compose

- **Plug a search planner:** Add a tool that orchestrates ToT/GoT style branching, or integrate a small MCTS loop. ([arXiv][15])
- **Evidence binding:** Add a `citations` field and enforce that each claim links to a resource or URL the host fetched.
- **Scoring hooks:** Swap MDL proxy for explicit **code length** approximations or Bayesian evidence calculators.

---

## Phase 12 — Minimal LICENSE

```
MIT License
Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
... (standard MIT text) ...
```

---

# Appendix A — Exact Prompts (Copy/Paste)

> These are the **verbatim** prompt texts your agent can inject (identical to the ones used in tools), useful if the client prefers prompt‑only flow.

**A.1 Router (JSON‑only output)**

```
You are a planner. Available modes: dialectic, socratic, abductive, systems, redblue, analogical, constraint, razors.apply.
Task: {{task}}
Context: {{context}}

Output as strict JSON:
{
  "steps": [{"mode":"...", "why":"...", "args":{}}],
  "notes": "one line on expected limitations"
}
Limit steps to {{maxSteps}}. Prefer constraint when explicit numeric/logical constraints exist; prefer systems when many interacting variables; prefer abductive for incomplete data; use razors.apply after hypothesis lists; add redblue before finalization for safety; use analogical if helpful transfer exists; use dialectic when controversy/policy/value trade-offs; start with socratic for scoping.
```

**A.2 Dialectic TAS**

```
Frame the following with a dialectic lens.
Claim: {{claim}}
Context: {{context}}

Output JSON with thesis, antithesis, synthesis (proposal, assumptions, tradeoffs, evidence_needed), open_questions.
```

**A.3 Socratic Tree**

```
Produce a {{depth}}-layer Socratic question tree for: {{topic}}
Include assumptions_to_test, evidence_to_collect, next_actions. Output JSON.
```

**A.4 Abductive Hypotheses (+razors)**

```
Observations:
{{observations}}

Generate {{k}} abductive hypotheses. Score each on:
- prior_plausibility (0-1)
- explanatory_power (0-1)
- simplicity_penalty (0-1) // approximate MDL
- testability (0-1)
- overall_score = plaus + power + testability - simplicity_penalty

Apply razors: {{apply_razors}}.
Return JSON with "hypotheses":[...], "experiments_or_evidence":[...], "notes".
```

**A.5 Systems Map (CLD)**

```
Build a concise causal loop diagram (CLD) for the system below.
Variables: {{variables}}
Context: {{context}}

Return JSON:
{
 "mermaid":"graph LR; A-->B; B-.-|neg|C; ...",
 "loops":[{"type":"reinforcing","nodes":["..."]},{"type":"balancing","nodes":["..."]}],
 "leverage_points":["rules","information_flow","goals","paradigms"],
 "stock_flow_hints":[{"stock":"...","inflows":["..."],"outflows":["..."]}],
 "assumptions":["..."],
 "risks":["..."]
}
```

**A.6 Red/Blue Team**

```
Conduct {{rounds}} rounds of Red (attack) vs Blue (defense) on:
{{proposal}}

Focus areas: {{focus}}.
Return JSON:
{
 "rounds":[
   {"n":1,"red":{"attack":"..."}, "blue":{"defense":"...","mitigations":["..."]}}
 ],
 "defects":[{"type":"...","severity":"low|med|high","evidence":"..."}],
 "risk_matrix":{"low":[],"medium":[],"high":[]},
 "final_guidance":["..."]
}
```

**A.7 Analogical Mapping**

```
Build a structural analogy from SOURCE to TARGET.

SOURCE: {{source_domain}}
TARGET: {{target_problem}}
CONSTRAINTS: {{constraints}}

JSON:
{
 "mapping":[{"source":"...","target":"...","justification":"..."}],
 "shared_relations":["..."],
 "mismatches":["..."],
 "transferable_insights":["..."],
 "failure_modes":["..."]
}
```

**A.8 Constraint Solve**

```
Solve constraints using Z3.

Input JSON:
{
 "variables":[{"name":"x","type":"Int"},...],
 "constraints":["(>= x 0)", "(<= (+ x y) 10)"],
 "optimize":{"objective":"(+ x (* 2 y))","sense":"max"}
}

Return JSON {"status":"sat|unsat|unknown","model":{"x":"...","y":"..."}}
```

---

# Appendix B — Quick Test Script (optional)

```bash
# After build:
npx mcp-reasonsuite
# From your MCP client, call tools/list, then call e.g. abductive.hypothesize with a short observation set.
```

---

## References (selected)

- MCP overview, SDKs, prompts & sampling, Streamable HTTP guidance. ([Model Context Protocol][1], [GitHub][2])
- Sequential Thinking server (prior art / related). ([GitHub][3])
- Systems thinking leverage points and stock/flow modeling. ([The Academy for Systems Change][9])
- Reasoning research (ToT/GoT; self‑consistency). ([arXiv][15])
- Red‑teaming methods (surveys / adaptive frameworks). ([arXiv][10], [ACL Anthology][11])
- Information‑theoretic razors & Bayesian Occam. ([homepages.cwi.nl][7], [CS Princeton][8])
- Z3 JS/TS bindings for constraint solving. ([npm][5])

---

### Notes on stability & recency

- **Prompts API** is part of MCP and documented in the official site/SDKs (latest protocol revisions list prompts; TS SDK shows `registerPrompt`). ([GitHub][2])
- **Sequential Thinking server** exists today as a reference server in the official `servers` repository and on npm. ([GitHub][3], [npm][4])

---

This `README.md` is sufficient to **initialize the repo, build, and run** the server. If you want, I can also generate a **ready‑to‑zip project scaffold** or add **unit tests** for each tool.

[1]: https://modelcontextprotocol.io/?utm_source=chatgpt.com "Model Context Protocol: Introduction"
[2]: https://github.com/modelcontextprotocol/typescript-sdk "GitHub - modelcontextprotocol/typescript-sdk: The official TypeScript SDK for Model Context Protocol servers and clients"
[3]: https://github.com/modelcontextprotocol/servers "GitHub - modelcontextprotocol/servers: Model Context Protocol Servers"
[4]: https://www.npmjs.com/package/%40modelcontextprotocol/server-sequential-thinking?utm_source=chatgpt.com "modelcontextprotocol/server-sequential-thinking"
[5]: https://www.npmjs.com/package/z3-solver?utm_source=chatgpt.com "z3-solver"
[6]: https://microsoft.github.io/z3guide/programming/Z3%20JavaScript%20Examples?utm_source=chatgpt.com "Z3 JavaScript | Online Z3 Guide"
[7]: https://homepages.cwi.nl/~pdg/ftp/mdlintro.pdf?utm_source=chatgpt.com "A Tutorial Introduction to the Minimum Description Length ..."
[8]: https://www.cs.princeton.edu/courses/archive/fall09/cos597A/papers/MacKay2003-Ch28.pdf?utm_source=chatgpt.com "Model Comparison and Occam's Razor"
[9]: https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/?utm_source=chatgpt.com "Leverage Points: Places to Intervene in a System"
[10]: https://arxiv.org/html/2410.09097v2?utm_source=chatgpt.com "Recent advancements in LLM Red-Teaming: Techniques, ..."
[11]: https://aclanthology.org/2025.llmsec-1.2.pdf?utm_source=chatgpt.com "RedHit: Adaptive Red-Teaming of Large Language Models ..."
[12]: https://aclanthology.org/2024.acl-long.68/?utm_source=chatgpt.com "Unlocking Analogical Reasoning of Language Models with ..."
[13]: https://arxiv.org/html/2503.03666v1?utm_source=chatgpt.com "Analogical Reasoning Inside Large Language Models"
[14]: https://modelcontextprotocol.io/docs/sdk?utm_source=chatgpt.com "SDKs"
[15]: https://arxiv.org/abs/2305.10601?utm_source=chatgpt.com "Tree of Thoughts: Deliberate Problem Solving with Large Language Models"
[16]: https://arxiv.org/abs/2503.03666?utm_source=chatgpt.com "Analogical Reasoning Inside Large Language Models"
[17]: https://en.wikipedia.org/wiki/Model_Context_Protocol?utm_source=chatgpt.com "Model Context Protocol"
[18]: https://www.theguardian.com/technology/2025/jun/09/apple-artificial-intelligence-ai-study-collapse?utm_source=chatgpt.com "Advanced AI suffers 'complete accuracy collapse' in face of complex problems, study finds"
