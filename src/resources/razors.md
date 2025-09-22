# Reasoning Razors

Use these heuristics to prune weak explanations, challenge extraordinary claims, and focus investigation time on the options most likely to survive scrutiny. The `razors.apply` tool and several ReasonSuite prompts reference the guidance below.

## MDL / Occam's Razor
- Prefer hypotheses with the **Minimum Description Length**: the shortest combined encoding of the model plus the data when the model is true.
- Penalise gratuitous entities, parameters, or branching logic that do not improve predictive power.
- When comparing explanations, subtract a *simplicity penalty* from otherwise strong candidates.

## Bayesian Occam's Razor
- In Bayesian reasoning, complex hypotheses distribute probability mass across a larger outcome space, reducing posterior odds unless supported by strong evidence.
- Downweight stories that require many precise coincidences to remain plausible.
- Reward hypotheses that make sharp, testable predictions.

## Sagan Standard
- "Extraordinary claims require extraordinary evidence." Elevate the evidence bar when a proposal overturns well-supported priors or implies high-impact consequences.
- Ask: *What observations would persuade a sceptical but informed reviewer?* If such evidence is missing, the claim should be deferred or reframed.

## Hitchens's Razor
- "What can be asserted without evidence can be dismissed without evidence."
- Require explicit citations, data, or derivations for every major step in a chain of reasoning.
- Flag bare assertions for follow-up fact-finding rather than treating them as premises.

## Hanlon's Razor
- "Never attribute to malice that which is adequately explained by neglect or incompetence."
- When diagnosing failures or incidents, inspect mundane causes (misconfigurations, missing process, noisy data) before invoking adversarial intent.
- Combine with the red/blue tool to check whether adversarial scenarios still matter after simpler explanations are exhausted.

## Popper's Falsifiability Principle
- Prefer hypotheses that expose themselves to clear refutation.
- Record the *critical tests* or experiments that would falsify each claim.
- Treat unfalsifiable or overly vague narratives as high risk: they cannot be improved by feedback loops and often mask confirmation bias.

## Practical checklist

1. **List candidates.** Use Socratic or Abductive tools to enumerate explanations, then feed the JSON directly into `razors.apply`.
2. **Score with razors.** For each candidate note which razor(s) triggered and why. Keep a shortlist of the survivors.
3. **Design tests.** Hand the shortlist to `reasoning.scientific` or the constraint solver to design falsification attempts.
4. **Challenge before commitment.** Run `redblue.challenge` to probe for failure modes, then revise or drop weak options.

Documenting which razor eliminated an option builds a reusable knowledge trail and prevents teams from cycling through the same weak hypotheses in future investigations.
