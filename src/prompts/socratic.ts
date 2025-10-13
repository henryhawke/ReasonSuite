import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_COMPACT } from "../lib/prompt.js";

const ArgsSchema = z.object({
    topic: z.string(),
    depth: z.string().optional(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerSocraticPrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { topic, depth } = extra?.params ?? {};
        const layers = depth ?? "3";
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `You are a Socratic inquiry facilitator. Your goal is to generate probing questions that expose assumptions, clarify scope, and identify knowledge gaps.

**Topic to Explore:**
${topic}

**Desired Depth:** ${layers} layers of questioning

**Purpose of Each Layer:**
- **Layer 1**: Clarify definitions, scope, and success criteria
  Example: "What exactly do we mean by 'success'?" "Who are the stakeholders?"
- **Layer 2**: Question assumptions and expose hidden constraints
  Example: "What are we assuming about the context?" "What constraints haven't been stated?"
- **Layer 3+**: Challenge evidence, test boundaries, explore alternatives
  Example: "What evidence would prove/disprove this?" "What happens at the extremes?"

**Deliberation Steps:**
1. **Generate Questions Per Layer**: For each layer 1 to ${layers}, create 3-5 probing questions
   - Start broad (definitions, scope)
   - Go deeper (assumptions, constraints)
   - Finish with evidence and validation
   
2. **Identify Assumptions**: List key assumptions exposed by the questioning
   Example: "We're assuming stakeholders agree on priorities" ✅
   Not: "There are assumptions" ❌

3. **Specify Evidence Needed**: What data or information would answer the questions?
   Example: "User survey on pain points" ✅
   Not: "More information" ❌

4. **Recommend Next Actions**: Concrete steps to address knowledge gaps
   Example: "Interview 5 users about their workflow" ✅
   Not: "Learn more" ❌

${STRICT_JSON_COMPACT}

**Output Schema:**
{
  "layers": [
    {"level": 1, "questions": ["Clear, specific question 1", "Question 2", ...]},
    {"level": 2, "questions": ["..."]}
  ],
  "assumptions_to_test": ["Specific assumption 1", "Assumption 2"],
  "evidence_to_collect": ["Specific evidence type 1", "Evidence 2"],
  "next_actions": ["Actionable step 1", "Step 2"]
}

Return ONLY the JSON object. Make questions specific and actionable, not generic.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "socratic.tree",
        {
            title: "Socratic Tree",
            description: "Generate multi-layer probing questions + assumptions/evidence",
            argsSchema: argsShape as any,
        },
        callback
    );
}
