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
