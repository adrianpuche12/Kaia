/**
 * Script de testing para AI Providers
 *
 * Uso:
 *   npx ts-node src/providers/test-providers.ts
 */

import 'dotenv/config';
import { getAIProviderFactory } from './factory/ai.factory';

async function testProviders() {
  console.log('='.repeat(60));
  console.log('TESTING AI PROVIDERS');
  console.log('='.repeat(60));

  try {
    // Inicializar factory
    const factory = getAIProviderFactory();

    console.log('\n1. Testing connectivity of all providers...\n');
    const connectionResults = await factory.testAllProviders();

    for (const [provider, isConnected] of Object.entries(connectionResults)) {
      const status = isConnected ? '✅ CONNECTED' : '❌ FAILED';
      console.log(`   ${provider}: ${status}`);
    }

    console.log('\n2. Getting provider information...\n');
    const providersInfo = factory.getAllProvidersInfo();

    for (const [provider, info] of Object.entries(providersInfo)) {
      console.log(`   ${provider.toUpperCase()}:`);
      console.log(`      Model: ${info.model}`);
      console.log(`      Max Tokens: ${info.limits?.maxTokens}`);
      console.log(`      Context: ${info.limits?.maxRequestSize?.toLocaleString()} tokens`);
      console.log(`      Cost: $${info.cost?.per1KTokens} per 1K tokens`);
      console.log(`      Features: ${Object.entries(info.features || {})
        .filter(([_, v]) => v)
        .map(([k]) => k)
        .join(', ')}`);
      console.log('');
    }

    console.log('3. Testing answer generation...\n');

    const testPrompt = 'Explain what you are and what you can do in one sentence.';

    console.log(`   Prompt: "${testPrompt}"\n`);

    const result = await factory.generateAnswer({
      prompt: testPrompt,
      mode: 'expert',
    });

    console.log(`   Provider: ${result.provider}`);
    console.log(`   Model: ${result.model}`);
    console.log(`   Mode: ${result.mode}`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    console.log(`   Tokens Used: ${result.tokensUsed.total} (${result.tokensUsed.input} in + ${result.tokensUsed.output} out)`);
    console.log(`   Estimated Cost: $${result.estimatedCost?.toFixed(6)}`);
    console.log(`\n   Answer:\n   ${result.answer}\n`);

    console.log('='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Ejecutar tests
testProviders();
