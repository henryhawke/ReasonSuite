// Quick test of OpenRouter LLM connection
import { directLLMSample } from "./dist/lib/llm.js";

async function test() {
  console.log("Testing OpenRouter connection...");
  const result = await directLLMSample(
    'Say \'hello\' in JSON format: {"message": "hello"}',
    50
  );
  console.log("Result:", JSON.stringify(result, null, 2));
}

test().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
