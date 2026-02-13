#!/usr/bin/env node

const { RugPullDetector } = require('./src/rugPullDetector');

async function testTokenResolution() {
  console.log('🔍 Testing Token Symbol Resolution...\n');
  
  const detector = new RugPullDetector();
  
  // Test cases
  const testSymbols = ['SOL', 'USDC', 'RAY', 'WIF', 'BONK'];
  
  for (const symbol of testSymbols) {
    try {
      console.log(`Testing symbol: ${symbol}`);
      const result = await detector.analyzeTokenBySymbol(symbol);
      console.log(`✅ Success: ${result.tokenSymbol} -> Risk Score: ${result.riskScore}\n`);
    } catch (error) {
      console.log(`❌ Error for ${symbol}: ${error.message}\n`);
    }
  }
  
  console.log('🎉 Token resolution testing complete!');
}

// Run the test
testTokenResolution().catch(console.error);