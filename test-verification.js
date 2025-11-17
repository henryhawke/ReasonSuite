// Test verification metadata in constraint solver
import { spawn } from "child_process";

const testCase = {
  id: 1,
  method: "tools/call",
  params: {
    name: "constraint.solve",
    arguments: {
      model_json: JSON.stringify({
        variables: [{ name: "x", type: "Int" }, { name: "y", type: "Int" }],
        constraints: ["x >= 0", "y >= 0", "x + y <= 10"],
        optimize: { objective: "x + y", sense: "max" }
      })
    },
  },
};

async function runTest() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["dist/index.js"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const request = JSON.stringify({
      jsonrpc: "2.0",
      id: testCase.id,
      method: testCase.method,
      params: testCase.params,
    }) + "\n";

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}. stderr: ${stderr}`));
      } else {
        try {
          const lines = stdout.trim().split('\n');
          const response = JSON.parse(lines[lines.length - 1]);
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}. stdout: ${stdout}`));
        }
      }
    });

    child.stdin.write(request);
    child.stdin.end();
  });
}

console.log("Testing constraint solver verification metadata...");
runTest()
  .then((response) => {
    console.log("\n=== Constraint Solver Response ===");
    console.log(JSON.stringify(response, null, 2));

    if (response.result && response.result.content) {
      const content = JSON.parse(response.result.content[0].text);
      console.log("\n=== Parsed Content ===");
      console.log(JSON.stringify(content, null, 2));

      if (content._verification) {
        console.log("\n✓ Verification metadata present!");
        console.log("  - Hash:", content._verification.argumentHash);
        console.log("  - From cache:", content._verification.fromCache);
        console.log("  - Verifiable:", content._verification.verifiable);
        if (content._verification.proofArtifacts) {
          console.log("  - Proof artifacts included:");
          console.log("    - Models:", content._verification.proofArtifacts.models ? "Yes" : "No");
          console.log("    - Statistics:", content._verification.proofArtifacts.statistics ? "Yes" : "No");
          console.log("    - SMT Script:", content._verification.proofArtifacts.smtScript ? "Yes" : "No");
          console.log("    - Causal Analysis:", content._verification.proofArtifacts.causalAnalysis ? "Yes" : "No");
        }
      } else {
        console.log("\n✗ Verification metadata missing!");
      }
    }
  })
  .catch((err) => {
    console.error("Test failed:", err.message);
    process.exit(1);
  });
