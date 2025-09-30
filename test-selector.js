// Test script to verify selector is using LLM instead of fallback
import { registerSelector } from "./dist/tools/selector.js";

class TestLLMServer {
  tools = new Map();

  registerTool(name, _meta, handler) {
    this.tools.set(name, handler);
  }
}

async function testSelectorLLM() {
  console.log("Testing selector with LLM...\n");

  const server = new TestLLMServer();
  registerSelector(server);

  try {
    const selectorResult = await server.tools.get("reasoning.selector")({
      request: "What is the best way to optimize a database query?",
      context: "Performance tuning scenario",
    });

    console.log("Selector result type:", typeof selectorResult);
    console.log("Selector result:", selectorResult);

    if (!selectorResult || !selectorResult.content) {
      console.log("No content in selector result");
      return false;
    }

    // Handle different response structures
    let textContent = null;
    if (selectorResult.content && Array.isArray(selectorResult.content)) {
      textContent = selectorResult.content[0]?.text;
    } else if (selectorResult.content?.text) {
      textContent = selectorResult.content.text;
    }

    console.log("Raw response:", textContent);

    let result;
    try {
      result = JSON.parse(textContent);
      console.log("Selector result:", JSON.stringify(result, null, 2));
    } catch (e) {
      console.log("Failed to parse JSON:", e);
      return false;
    }
  } catch (e) {
    console.log("Error calling selector:", e);
    return false;
  }

  // Check if it's using fallback
  const isFallback = result?.meta?.source === "fallback";
  if (isFallback) {
    console.log("\n❌ ISSUE: Selector is still using fallback mode!");
    console.log("Meta:", result.meta);
    return false;
  } else {
    console.log("\n✅ SUCCESS: Selector is using LLM mode!");
    console.log("Meta source:", result.meta?.source);
    return true;
  }
}

// Run the test
testSelectorLLM().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
