#!/usr/bin/env node

const { RugPullDetector } = require('./src/rugPullDetector');

async function runDemo() {
  console.log('🚀 Solana Rug Pull Detector - Comprehensive Demo');
  console.log('================================================\n');
  
  const detector = new RugPullDetector();
  
  // Test cases that demonstrate different risk levels
  const testCases = [
    { symbol: 'SOL', expectedRisk: 'LOW' },
    { symbol: 'USDC', expectedRisk: 'LOW' },
    { symbol: 'BONK', expectedRisk: 'MEDIUM' },
    { symbol: 'WIF', expectedRisk: 'MEDIUM' },
    { symbol: 'FAKE_TOKEN', expectedRisk: 'CRITICAL' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`🔍 Analyzing token: ${testCase.symbol}`);
      
      // This will resolve symbol to mint address and analyze
      const result = await detector.analyzeTokenBySymbol(testCase.symbol);
      
      if (result.error) {
        console.log(`⚠️  ${testCase.symbol}: ${result.error}`);
        console.log(`   Risk Score: N/A`);
        console.log(`   Recommendation: ${result.recommendations.join(', ')}`);
      } else {
        console.log(`✅ ${testCase.symbol} Analysis Complete:`);
        console.log(`   Mint Address: ${result.mintAddress}`);
        console.log(`   Risk Score: ${result.riskScore}/100`);
        console.log(`   Risk Level: ${result.riskLevel}`);
        console.log(`   Recommendations:`);
        result.recommendations.slice(0, 2).forEach(rec => {
          console.log(`     • ${rec}`);
        });
      }
      
      console.log('');
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`❌ Error analyzing ${testCase.symbol}: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🎉 Demo Complete!');
  console.log('Your Solana Rug Pull Detector is ready for the Colosseum Agent Hackathon!');
  console.log('\nKey Features Demonstrated:');
  console.log('• Token symbol resolution (SOL → actual mint address)');
  console.log('• Three-layer risk analysis (on-chain, social, code)');
  console.log('• Real-time risk scoring (0-100 scale)');
  console.log('• Actionable recommendations based on risk level');
  console.log('• Graceful error handling for unknown tokens');
}

// Run the demo
runDemo().catch(console.error);