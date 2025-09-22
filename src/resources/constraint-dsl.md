# Constraint Mini-DSL

The ReasonSuite constraint tool consumes JSON that describes decision variables, hard constraints, and an optional optimisation objective. The JSON is validated with Zod, translated to SMT-LIB, and solved with Z3. This guide explains how to structure requests and includes idiomatic patterns for common scenarios.

## Top-level structure

```json
{
  "variables": [{ "name": "x", "type": "Int" }],
  "constraints": ["(>= x 0)", "(<= x 10)"],
  "optimize": { "objective": "x", "sense": "max" }
}
```

| Field | Description |
| --- | --- |
| `variables` | Array of variable declarations. Each entry must specify a `name` (letters/underscores) and a `type`: `Int`, `Real`, or `Bool`. |
| `constraints` | Array of SMT-LIB expressions written as strings. Each expression is wrapped in `(assert …)` before being sent to Z3. Leave empty to solve a purely optimisation problem. |
| `optimize` | Optional optimisation directive. `objective` is any SMT-LIB expression. `sense` accepts `"min"` or `"max"`. When omitted the solver returns any satisfying model. |

## Declaring variables

- Use descriptive names: `inventory`, `throughput`, `is_enabled`.
- Integers (`Int`) are appropriate for counts or enumerations; use `Real` for continuous values; use `Bool` for logical flags.
- Duplicate names are rejected.

Examples:

```json
{
  "variables": [
    { "name": "units", "type": "Int" },
    { "name": "cost", "type": "Real" },
    { "name": "feature_enabled", "type": "Bool" }
  ]
}
```

## Writing constraints

Constraints are plain SMT-LIB snippets. The tool automatically wraps each string with `(assert …)` so you only need the inner expression. Useful combinators:

- `(= a b)` equality
- `(>= a b)`, `(<= a b)` inequalities
- `(and …)`, `(or …)`, `(not …)` logical composition
- `(+ …)`, `(- …)`, `(* …)`, `(/ …)` arithmetic
- `(ite condition then else)` for conditional expressions

Example — simple scheduling constraints:

```json
{
  "variables": [
    { "name": "hours_engineering", "type": "Int" },
    { "name": "hours_design", "type": "Int" }
  ],
  "constraints": [
    "(>= hours_engineering 0)",
    "(>= hours_design 0)",
    "(= (+ hours_engineering hours_design) 40)",
    "(>= hours_engineering 10)",
    "(>= hours_design 8)"
  ]
}
```

## Optimisation

When `optimize` is supplied, the tool switches to Z3's `Optimize` mode. For minimisation use `"sense": "min"`; for maximisation use `"sense": "max"`.

```json
{
  "variables": [
    { "name": "x", "type": "Int" },
    { "name": "y", "type": "Int" }
  ],
  "constraints": [
    "(>= x 0)",
    "(>= y 0)",
    "(= (+ x y) 10)"
  ],
  "optimize": {
    "objective": "(+ (* 2 x) y)",
    "sense": "max"
  }
}
```

If the optimisation problem is infeasible (`unsat` or `unknown`), the response still includes the solver status.

## Tips and troubleshooting

- **Validate incrementally.** Start with a small subset of constraints; add more as the solver returns `sat` to isolate mistakes.
- **Watch types.** Mixing `Int` and `Real` automatically coerces integers to reals. Use `to_int`/`to_real` when required.
- **Boolean flags.** Encode logical relations using `Bool` variables and `=>` implications (e.g., `(=> feature_enabled (>= throughput 100))`).
- **Piecewise objectives.** Use `(ite …)` within the `objective` to encode conditional scoring.
- **Debugging unsat.** Temporarily remove `optimize` and inspect the reported model; if still `unsat`, relax constraints until the solver returns a model, then reintroduce tightened conditions one at a time.

## Suggested workflow

1. List the decision variables and mark their domains.
2. Translate each requirement into SMT-LIB expressions. The Socratic or Scientific tools can help enumerate assumptions first.
3. Add optional optimisation criteria once feasibility is confirmed.
4. Run `constraint.solve` and inspect the resulting `model` for assignments.
5. Pair with `razors.apply` or `redblue.challenge` to stress-test assumptions or compare alternative formulations.
