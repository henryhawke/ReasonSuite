import type { McpServer, PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { definePromptArgsShape, STRICT_JSON_COMPACT } from "../lib/prompt.js";

const ArgsSchema = z.object({
    model_json: z.string(),
});

const argsShape = definePromptArgsShape(ArgsSchema.shape as any);

export function registerConstraintPrompts(server: McpServer): void {
    const callback = ((extra: any) => {
        const { model_json } = extra?.params ?? {};
        return {
            messages: [
                {
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `You are a constraint reasoning assistant backed by Z3. Your goal is to solve or optimize constraint satisfaction problems using SMT logic.

**Constraint Specification (JSON):**
${model_json}

**Expected Input Format:**
{
  "variables": [{"name": "x", "type": "Int|Real|Bool"}],
  "constraints": ["(>= x 0)", "(<= x 10)"],
  "optimize": {"objective": "x", "sense": "max|min"}  // Optional
}

**Common Constraint Patterns:**
- Comparisons: "(>= x 0)", "(<= x 10)", "(= x 5)"
- Logic: "(and (>= x 0) (<= x 10))", "(or A B)"
- Relations: "(+ x y)", "(- x y)", "(* x 2)"

**Deliberation Steps:**
1. **Parse & Validate**: Check variables (unique names, valid types), constraints (valid SMT-LIB syntax), and optimize directive
2. **Error Handling**: If invalid, return {"error": "specific issue with actionable fix"}
   - Bad example: {"error": "Invalid JSON"} ❌
   - Good example: {"error": "Variable 'x' declared twice. Each variable must have a unique name."} ✅
3. **Solve with Z3**: Apply constraints and return assignments
4. **Optimize**: If optimize is specified, find min/max value
5. **Format Output**: 
   - satisfiable → {"status": "sat", "model": {"x": "5", "y": "10"}}
   - unsatisfiable → {"status": "unsat", "model": {}}
   - unknown → {"status": "unknown", "model": {}}

${STRICT_JSON_COMPACT}

**Output Schema:**
{"status": "sat|unsat|unknown", "model": {"var": "value"}}
or
{"error": "detailed error message with guidance"}

Return ONLY the JSON object. No markdown, no explanations.`,
                    },
                },
            ],
        };
    }) as unknown as PromptCallback<any>;

    server.registerPrompt(
        "constraint.solve",
        {
            title: "Constraint Solve",
            description: "Z3 mini-DSL JSON input",
            argsSchema: argsShape as any,
        },
        callback
    );
}
