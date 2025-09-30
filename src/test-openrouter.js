#!/usr/bin/env node
// Simple test script for OpenRouter integration
// Run with: node dist/test-openrouter.js

import {
  directLLMSample,
  validateAPIConfiguration,
  clearLLMCache,
  getCacheStats,
} from "../dist/lib/llm.js";

async function testOpenRouter() {
  console.log("🧪 Testing OpenRouter Integration");
  console.log("=====================================");

  // Check API configuration
  const config = validateAPIConfiguration();
  console.log("API Configuration:");
  console.log(
    `  OpenRouter: ${config.openrouter ? "✅ Configured" : "❌ Not configured"}`
  );
  console.log(
    `  OpenAI: ${config.openai ? "✅ Configured" : "❌ Not configured"}`
  );
  console.log(
    `  Anthropic: ${config.anthropic ? "✅ Configured" : "❌ Not configured"}`
  );
  console.log(`  Any configured: ${config.anyConfigured ? "✅" : "❌"}`);

  if (!config.anyConfigured) {
    console.log("\n❌ No API keys configured. Please set at least one of:");
    console.log("  OPENROUTER_API_KEY=your_key_here");
    console.log("  OPENAI_API_KEY=your_key_here");
    console.log("  ANTHROPIC_API_KEY=your_key_here");
    return;
  }

  // Test basic functionality
  const testPrompt =
    "Hello! Please respond with a short greeting and tell me which AI model you are.";
  const maxTokens = 100;

  console.log("\n🔄 Testing LLM sampling...");
  console.log(`Prompt: "${testPrompt}"`);
  console.log(`Max tokens: ${maxTokens}`);

  try {
    const result = await directLLMSample(testPrompt, maxTokens);

    if (result && result.success) {
      console.log("\n✅ Success!");
      console.log(`Provider: ${result.provider}`);
      console.log(`Response: "${result.raw}"`);

      // Show cache stats
      const cacheStats = getCacheStats();
      console.log(`\n📊 Cache Stats:`);
      console.log(`  Entries: ${cacheStats.size}`);
      console.log(`  Max age: ${Math.round(cacheStats.maxAge / 1000)}s`);
      console.log(`  TTL: ${Math.round(cacheStats.ttl / 1000)}s`);
    } else {
      console.log("\n❌ Failed:");
      console.log(`Reason: ${result?.reason || "Unknown error"}`);
    }
  } catch (error) {
    console.log("\n💥 Error during testing:");
    console.log(error.message);
  }

  // Test cache functionality
  console.log("\n🔄 Testing cache functionality...");
  const cacheTestPrompt =
    "This is a test prompt for caching. Please respond with 'CACHE_TEST'.";
  const startTime = Date.now();

  try {
    // First call
    const result1 = await directLLMSample(cacheTestPrompt, 50);
    const firstCallTime = Date.now() - startTime;

    // Second call (should be cached)
    const result2 = await directLLMSample(cacheTestPrompt, 50);
    const secondCallTime = Date.now() - startTime - firstCallTime;

    console.log(`First call: ${firstCallTime}ms`);
    console.log(`Cached call: ${secondCallTime}ms`);
    console.log(
      `Speedup: ${
        Math.round((firstCallTime / secondCallTime) * 100) / 100
      }x faster`
    );

    if (result1?.raw === result2?.raw) {
      console.log("✅ Cache working correctly - responses match");
    } else {
      console.log("❌ Cache issue - responses don't match");
    }
  } catch (error) {
    console.log("❌ Cache test failed:", error.message);
  }
}

async function main() {
  await testOpenRouter();

  console.log("\n📖 OpenRouter Setup Instructions:");
  console.log("1. Get your API key from https://openrouter.ai/keys");
  console.log(
    "2. Set environment variable: export OPENROUTER_API_KEY=your_key_here"
  );
  console.log(
    "3. Optional: Set OPENROUTER_MODEL to specify model (default: meta-llama/llama-3.1-8b-instruct)"
  );
  console.log("4. Optional: Set OPENROUTER_TEMPERATURE (default: 0.2)");
  console.log("\nSupported models on OpenRouter:");
  console.log("  - meta-llama/llama-3.1-8b-instruct (default)");
  console.log("  - meta-llama/llama-3.1-70b-instruct");
  console.log("  - meta-llama/llama-3.1-405b-instruct");
  console.log("  - mistralai/mistral-7b-instruct");
  console.log("  - mistralai/mixtral-8x7b-instruct");
  console.log("  - and many more...");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
