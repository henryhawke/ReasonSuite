import { spawn } from "child_process";

const testCases = [
  {
    id: 7,
    method: "tools/call",
    params: {
      name: "dialectic.tas",
      arguments: { claim: "We should implement feature flags" },
    },
  },
  {
    id: 8,
    method: "tools/call",
    params: {
      name: "systems.map",
      arguments: { variables: ["Supply", "Demand"], context: "retail" },
    },
  },
  {
    id: 9,
    method: "tools/call",
    params: {
      name: "redblue.challenge",
      arguments: { proposal: "Enable auto-merge", rounds: 1 },
    },
  },
];

async function runTest(testCase) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["dist/index.js"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const request =
      JSON.stringify({
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
        reject(
          new Error(`Process exited with code ${code}. stderr: ${stderr}`)
        );
      } else {
        try {
          const response = JSON.parse(stdout.trim());
          resolve(response);
        } catch (e) {
          reject(
            new Error(
              `Failed to parse response: ${e.message}. stdout: ${stdout}`
            )
          );
        }
      }
    });

    child.stdin.write(request);
    child.stdin.end();
  });
}

async function runAllTests() {
  for (const testCase of testCases) {
    try {
      console.log(`Running test ${testCase.id}...`);
      const response = await runTest(testCase);
      console.log(`✓ Test ${testCase.id} successful`);
      console.log(JSON.stringify(response, null, 2));
      console.log("---");
    } catch (error) {
      console.error(`✗ Test ${testCase.id} failed:`, error.message);
    }
  }
}

runAllTests().catch(console.error);
