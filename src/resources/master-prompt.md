# ReasonSuite Usage Guide

Use this guide to effectively select and use ReasonSuite's structured reasoning tools. All tools return strict JSON conforming to defined schemas.

## Quick Start: When to Use Each Tool

**Before starting ANY task, check this decision tree:**

1. **Multi-step or complex?** → `reasoning.router.plan`
2. **Uncertain which tool?** → `reasoning.selector`
3. **Match your need to a tool below** → Call that tool directly

## ⚠️ REQUIRED PARAMETERS CHECKLIST

**⚠️ CRITICAL: Before calling ANY tool, verify you have provided the required primary parameter:**

| Tool | Required Parameter | Example |
|------|-------------------|---------|
| `abductive.hypothesize` | `observations` | Observations about phenomenon to explain |
| `reasoning.router.plan` | `task` | Task description to plan |
| `socratic.inquire` | `topic` | Topic to clarify |
| `reasoning.divergent_convergent` | `prompt` | Prompt for idea generation |
| `redblue.challenge` | `proposal` | Proposal to challenge |
| `systems.map` | `variables` or `context` | Variables/context to map |
| `constraint.solve` | `model_json` | Constraint model definition |
| `analogical.map` | `source_domain`, `target_problem` | Source domain and target problem |
| `dialectic.tas` | `claim` | Claim to debate |
| `reasoning.scientific` | `goal` | Goal to achieve |
| `exec.run` | `code` | JavaScript code to execute |
| `reasoning.self_explain` | `query` | Query to explain reasoning for |

**⚠️ FAILURE TO PROVIDE REQUIRED PARAMETERS WILL CAUSE VALIDATION ERRORS**

## Common Usage Errors and How to Avoid Them

### ❌ WRONG: Calling abductive.hypothesize without observations

```javascript
// This will fail with validation error
abductive.hypothesize({
  "k": 3,
  "apply_razors": ["MDL", "BayesianOccam"]
})
```

### ✅ CORRECT: Always provide observations for abductive.hypothesize

```javascript
// This works correctly
abductive.hypothesize({
  "observations": "API response time increased from 200ms to 2000ms over 24 hours. Error rates also spiked from 0.1% to 5%. Database queries are taking 3x longer than normal.",
  "k": 3,
  "apply_razors": ["MDL", "BayesianOccam", "Sagan", "Hitchens", "Hanlon", "Popper"]
})
```

### Tool Usage Checklist Before Every Call

1. **✅ Identify the tool** you need based on the task pattern
2. **✅ Check the required parameter** for that tool from the checklist above
3. **✅ Ensure the required parameter** is provided and is the correct type
4. **✅ Add optional parameters** as needed
5. **✅ Call the tool** and handle any validation errors

### Example: Diagnosing Performance Issues

**Task:** "Why is my API slow?"

1. **Pattern match:** This is a diagnosis/root cause question → `abductive.hypothesize`
2. **Required parameter:** `observations` (string describing the issue)
3. **Call the tool:**

   ```javascript
   abductive.hypothesize({
     "observations": "API response times have increased from 200ms to 2000ms over the past 24 hours. Database query times have tripled. Error rates increased from 0.1% to 5%.",
     "k": 4
   })
   ```

4. **Expected result:** Ranked hypotheses about possible causes

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

### Tool-First Execution Protocol (Default Flow)

Use this sequence to stay tool-led; skip steps deliberately when the task is already scoped:

1) Selection

- When unsure which tool fits, call `reasoning.selector` with { request, context? }.
- If the request already maps cleanly to a tool (e.g., "generate hypotheses"), you may go straight to that tool and note the rationale.
- When you do run the selector, obey `primary_mode` and queue the returned `razor_stack` for pruning later.

2) Planning

- For multi-step or ambiguous work, call `reasoning.router.plan` with { task, context?, maxSteps }.
- If the plan is obvious (single calculation, one-off clarification), document the reason for skipping the router instead of forcing an extra call.
- Execute the plan steps in order when a plan is generated. Note any infeasible step and choose an alternative tool explicitly.

3) Execution Rules (per step)

- Call the specific tool for the step with the minimal valid arguments.
- If a step generates options (abductive/divergent), immediately call `razors.apply` before conclusions.
- Use `exec.run` for all calculations, code, parsing, or regex. Do not compute by hand.
- Use `constraint.solve` whenever numeric/logical limits or optimization appear.
- Use `redblue.challenge` before final answers when risk/safety/security/compliance is implicated.
- Use `reasoning.scientific` to structure experiments, evidence, and validation when the task calls for testing.
- Use `systems.map` when feedback loops/dynamics are present; `analogical.map` for precedent/transfer.

4) Synthesis

- Call `reasoning.self_explain` when transparency, audit trail, or self-critique is requested. Otherwise summarise findings directly in the controlling workflow.

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

### Tool Selection Guide (Trigger Patterns)

**ALWAYS** call `reasoning.selector` or `reasoning.router.plan` first unless you have a clear direct match below.

| Your Need | Tool to Use | Trigger Words | Must Pair With |
|-----------|-------------|---------------|----------------|
| Diagnose, debug, root cause | `abductive.hypothesize` | "why", "what caused", "diagnose", "investigate" | `razors.apply` |
| Unclear scope, vague request | `socratic.inquire` | "improve", "better", "help with", ambiguous goals | - |
| Generate ideas, brainstorm | `reasoning.divergent_convergent` | "options", "alternatives", "ideas", "brainstorm" | `razors.apply` |
| Multi-step task, strategy | `reasoning.router.plan` | "plan", "design", "implement", "roadmap" | varies |
| Uncertain which approach | `reasoning.selector` | anytime you're unsure | - |
| Interacting systems, dynamics | `systems.map` | "feedback", "interactions", "system behavior" | - |
| Comparisons, analogies | `analogical.map` | "similar to", "like", "compare", "precedent" | - |
| Optimization, constraints | `constraint.solve` | "optimize", "minimize", "maximize", "schedule", "within limits" | - |
| Risk, security, safety | `redblue.challenge` | "risk", "attack", "vulnerability", "what could go wrong" | - |
| Debate, trade-offs | `dialectic.tas` | "pros vs cons", "trade-offs", "arguments for/against" | - |
| Testing, validation | `reasoning.scientific` | "test", "validate", "experiment", "measure" | - |
| Math, code, calculations | `exec.run` | any calculation, code snippet, regex | - |
| Explain your thinking | `reasoning.self_explain` | "why did you", "explain", "reasoning", "rationale" | - |

**Critical Rules:**

1. If task needs 3+ steps → MUST use `reasoning.router.plan` first
2. After `abductive.hypothesize` → MUST call `razors.apply`
3. After `reasoning.divergent_convergent` → MUST call `razors.apply`
4. For ANY calculation → MUST use `exec.run` (never compute manually)
5. Before risky decisions → MUST use `redblue.challenge`
6. If uncertain → MUST use `reasoning.selector`

**Anti-Patterns (Don't do these):**

- ❌ Skipping tools and doing analysis yourself
- ❌ Using abductive/divergent without razors.apply afterwards
- ❌ Ignoring router plan steps or reordering them
- ❌ Computing math manually instead of using exec.run
- ❌ Guessing which tool when selector is available
