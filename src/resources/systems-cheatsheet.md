# Systems Thinking Cheatsheet

Use this reference when constructing causal loop diagrams (CLDs) or interpreting the output of the `systems.map` tool.

## Core concepts

- **Variables:** Elements whose levels change over time (e.g., demand, backlog, user trust). Stick to nouns or short noun phrases.
- **Links:** Directed arrows annotated with `+` (same-direction change) or `–` (opposite-direction change). A `+` link means if the source increases, the target eventually increases relative to its prior trajectory.
- **Delays:** Mark with `||` or a dotted line to show lagged effects.
- **Reinforcing loop (R):** Feedback that amplifies change. Example: word-of-mouth growth → more users → more word-of-mouth.
- **Balancing loop (B):** Feedback that counteracts change and drives the system toward a goal. Example: inventory → shipments → lower backlog → fewer rush orders → stabilised inventory.

## Building a CLD

1. **List the stocks and flows.** Stocks accumulate (inventory, knowledge, debt); flows increase or decrease them.
2. **Capture obvious loops.** For each loop determine whether it is reinforcing (R) or balancing (B).
3. **Highlight leverage points.** Ask where a small intervention yields a large effect: information flows, delays, buffers, rules, goals, or paradigms.
4. **Document assumptions and risks.** Note missing actors, policy constraints, or data that would validate the loop structure.

## Common leverage points (Meadows, 1999)

| Category | Example intervention |
| --- | --- |
| Parameters | Adjust thresholds, capacities, or budgets |
| Buffers | Increase slack time or spare inventory |
| Information flows | Improve telemetry, transparency, or feedback cadence |
| Rules/incentives | Change governance, KPIs, or escalation paths |
| Self-organisation | Enable local teams to adapt processes |
| Goals | Shift success metrics to align with long-term outcomes |
| Paradigms | Reframe mission, values, or mental models |

## Stock/flow patterns to consider

- **Bathtub structure:** Stock increases with inflow and decreases with outflow (e.g., backlog). Useful to check conservation and units.
- **Success to the successful:** Reinforcing loop that diverts resources toward already successful actors, starving others.
- **Limits to growth:** Reinforcing loop plus a slower balancing loop that introduces constraints (capacity, fatigue, regulation).
- **Shifting the burden:** Quick fixes relieve symptoms while weakening the capability to address root causes.

## Integrating with other tools

- After mapping loops, feed candidate leverage interventions into `abductive.hypothesize` or `reasoning.divergent_convergent` for option generation.
- Use `razors.apply` to drop interventions that require brittle assumptions or violate MDL.
- Combine with `constraint.solve` to test quantitative feasibility of proposed policy changes.
- Run `redblue.challenge` to surface unintended consequences before implementation.

## Quick checklist before finalising

- [ ] Every loop is labelled `R` or `B` and the polarity of each edge is clear.
- [ ] Assumptions list mentions missing data, external shocks, or boundary decisions.
- [ ] Risks capture both short-term and long-term failure modes.
- [ ] Mermaid diagram renders (copy/paste into [Mermaid Live Editor](https://mermaid.live/)).

Document the context and version of the diagram so future updates can track how the system changed over time.
