# ReasonSuite Master Prompt Template

Use this template to drive high-quality, structured outputs from ReasonSuite tools. Adapt the sections to your task; keep JSON responses strict and machine-parseable.

## Master Template (Router-led or Manual)

Goal: [objective one sentence]
Context: [key facts, constraints, stakeholders]
Non-Goals: [excluded scope]
Constraints:

- Deterministic JSON output only
- Cite assumptions and unknowns
- Prefer minimal sufficient complexity (Occam/MDL)

Deliverables:

- Primary artifact(s) in JSON matching the tool schema
- Brief risks and next actions

Verification:

- Internal consistency checks noted
- Open questions listed

If using the planning router, provide:

```text
Task: <what you want>
Context: <supporting details>
MaxSteps: 3-5
```

Return strictly formatted JSON per tool schemas below.

### Tool-First Execution Protocol (MANDATORY)

Follow this sequence to ensure tools are actually used rather than freehand reasoning:

1) Selection

- Call `reasoning.selector` with { request, context? }.
- Obey `primary_mode` and queue the returned `razor_stack` for pruning later.

2) Planning

- If the task is multi-step or ambiguous, call `reasoning.router.plan` with { task, context?, maxSteps }.
- Execute the plan steps strictly in order. Do not skip steps unless infeasible.

3) Execution Rules (per step)

- Call the specific tool for the step with the minimal valid arguments.
- If a step generates options (abductive/divergent), immediately call `razors.apply` before conclusions.
- Use `exec.run` for all calculations, code, parsing, or regex. Do not compute by hand.
- Use `constraint.solve` whenever numeric/logical limits or optimization appear.
- Use `redblue.challenge` before final answers when risk/safety/security/compliance is implicated.
- Use `reasoning.scientific` to structure experiments, evidence, and validation.
- Use `systems.map` when feedback loops/dynamics are present; `analogical.map` for precedent/transfer.

4) Synthesis

- After executing the plan, call `reasoning.self_explain` to produce a concise rationale and next actions.

5) Output Contract

- Emit only the strict JSON for the active tool's response.
- Never include commentary, prefixes, or extra keys not in the schema.

Anti-freehand rule: Do not attempt to solve without tools when a relevant tool exists.
If a tool fails, proceed to the next best tool or use deterministic fallbacks, then continue the plan.

---

### Tool Snippets

#### 1) Socratic Inquiry (`socratic.inquire`)

Prompt:

```text
Produce a <depth>-layer Socratic question tree for the topic.
Topic: <topic>
Context: <context>
Depth: <1..6>

Return strict JSON only:
{
  "layers": [
    {"level": 1, "questions": ["..."]},
    {"level": 2, "questions": ["..."]}
  ],
  "assumptions_to_test": ["..."],
  "evidence_to_collect": ["..."],
  "next_actions": ["..."]
}
```

#### 2) Abductive Hypotheses (`abductive.hypothesize`)

Prompt:

```text
Observations:
<bullet or paragraph list of observations>

Generate <k> hypotheses. Score each on prior_plausibility, explanatory_power, simplicity_penalty, testability; include overall score.
Apply razors: MDL, Hitchens, Sagan, Popper.

Return strict JSON only:
{
  "hypotheses": [
    {
      "id": "H1",
      "statement": "...",
      "rationale": "...",
      "scores": {
        "prior_plausibility": 0.6,
        "explanatory_power": 0.7,
        "simplicity_penalty": 0.2,
        "testability": 0.6,
        "overall": 1.7
      }
    }
  ],
  "experiments_or_evidence": ["test1"],
  "notes": "..."
}
```

#### 3) Razors Application (`razors.apply`)

Prompt:

```json
Candidates JSON:
[
  {"id":"H1","statement":"..."},
  {"id":"H2","statement":"..."}
]
Razors: MDL, BayesianOccam, Sagan, Hitchens, Hanlon, Popper

Return strict JSON only:
{
  "results": [
    {"id": "H1", "keep_or_drop": "keep", "reasons": ["..."], "risk_notes": "..."}
  ],
  "shortlist": ["H1"],
  "notes": "..."
}
```

#### 4) Systems Map (`systems.map`)

Prompt:

```text
Build a concise causal loop diagram (CLD).
Variables: <comma-separated or empty to infer>
Context: <supporting details>

Return strict JSON only:
{
  "mermaid": "graph LR; A-->B; B-.-|neg|C; ...",
  "loops": [
    {"type": "reinforcing", "nodes": ["..."]},
    {"type": "balancing", "nodes": ["..."]}
  ],
  "leverage_points": ["rules", "information_flow", "goals", "paradigms"],
  "stock_flow_hints": [
    {"stock": "...", "inflows": ["..."], "outflows": ["..."]}
  ],
  "assumptions": ["..."],
  "risks": ["..."]
}
```

---

### Recommended Practices

- Keep outputs strictly valid JSON; avoid trailing commas and commentary.
- Prefer fewer, better-scored hypotheses; prune with razors before committing.
- In systems maps, include at least one reinforcing and one balancing loop where plausible.
- Always list assumptions and next actions to enable follow-on execution.

### Tool Usage Guidance (Meta-Selection)

Always call `reasoning.selector` first with the user's request and optional context.
If the task is multi-step or ambiguous, immediately call `reasoning.router.plan` and then execute steps in order (no skipping).
Between steps, apply `razors.apply` after any generator outputs; prefer `exec.run` for all computation.

Use these cues to trigger tools when the selector is unavailable:

- Socratic (`socratic.inquire`): ambiguous scope, missing success criteria, undefined stakeholders.
- Abductive (`abductive.hypothesize`): diagnosis/root cause questions, unexplained anomalies, “why”.
- Razors (`razors.apply`): after abductive/divergent outputs, or when pruning options/claims.
- Systems (`systems.map`): interacting factors, feedback loops, dynamics, ecosystems.
- Analogical (`analogical.map`): precedent/comparison/analogy transfer with mismatch checks.
- Constraint (`constraint.solve`): numeric/logical limits, scheduling, budget, optimise/minimise/maximise.
- Red/Blue (`redblue.challenge`): risk/safety/security/bias/compliance prior to finalisation.
- Dialectic (`dialectic.tas`): contested/trade-off/policy debates requiring synthesis.
- Scientific (`reasoning.scientific`): experiments/tests/metrics/validation planning.
- Self-Explain (`reasoning.self_explain`): transparency/audit/rationale demand.
- Divergent (`reasoning.divergent_convergent`): brainstorm options, then prune with razors.
- Exec (`exec.run`): quick sandboxed calculations or prototypes only.

Rules:

- Default to `socratic.inquire` if no strong signals are present.
- Never duplicate the same tool in a plan unless justified by new evidence.
- If any generator (abductive/divergent) runs, follow with `razors.apply` before conclusions.
