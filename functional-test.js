#!/usr/bin/env node

const { RugPullDetector } = require('./src/rugPullDetector');

/**
 * Comprehensive Functional Test for Solana Rug Pull Detector
 * Tests the complete detection pipeline with realistic scenarios
 */

async function runFunctionalTests() {
  console.log('🚀 Starting Comprehensive Functional Tests...\n');
  
  // Test 1: Initialize the detector
  console.log('1. Initializing RugPullDetector...');
  let detector;
  try {
    detector = new RugPullDetector();
    console.log('✅ Detector initialized successfully\n');
  } catch (error) {
    console.log('❌ Failed to initialize detector:', error.message);
    return false;
  }

  // Test 2: Test with a known safe token (simulated)
  console.log('2. Testing with simulated SAFE token (low risk)...');
  try {
    // Mock the chain analyzer to return safe token data
    const originalChainAnalyzer = detector.chainAnalyzer;
    detector.chainAnalyzer = {
      getTokenInfo: async () => ({ symbol: 'SAFE' }),
      analyzeTokenEconomics: async () => ({
        riskScore: 10,
        redFlags: []
      })
    };
    
    detector.socialAnalyzer = {
      analyzeSocialSignals: async () => ({
        riskScore: 5,
        redFlags: []
      })
    };
    
    detector.codeAnalyzer = {
      analyzeCode: async () => ({
        riskScore: 8,
        redFlags: []
      })
    };

    const safeResult = await detector.analyzeToken('SAFE_TOKEN');
    console.log(`   Risk Score: ${safeResult.riskScore}`);
    console.log(`   Risk Level: ${safeResult.riskLevel}`);
    console.log(`   Recommendations: ${safeResult.recommendations.length} items`);
    
    if (safeResult.riskScore <= 30 && safeResult.riskLevel === 'SAFE') {
      console.log('✅ Safe token test passed\n');
    } else {
      console.log('❌ Safe token test failed\n');
      return false;
    }
    
    // Restore original analyzers
    detector.chainAnalyzer = originalChainAnalyzer;
    
  } catch (error) {
    console.log('❌ Safe token test failed:', error.message);
    return false;
  }

  // Test 3: Test with a high-risk token (simulated)
  console.log('3. Testing with simulated HIGH-RISK token...');
  try {
    // Mock the analyzers to return high-risk data
    const originalChainAnalyzer = detector.chainAnalyzer;
    detector.chainAnalyzer = {
      getTokenInfo: async () => ({ symbol: 'RUGPULL' }),
      analyzeTokenEconomics: async () => ({
        riskScore: 95,
        redFlags: ['Mint authority not renounced', 'Single wallet holds 95% supply']
      })
    };
    
    detector.socialAnalyzer = {
      analyzeSocialSignals: async () => ({
        riskScore: 88,
        redFlags: ['Bot activity detected', 'Fake influencer campaigns']
      })
    };
    
    detector.codeAnalyzer = {
      analyzeCode: async () => ({
        riskScore: 92,
        redFlags: ['Backdoor function found', 'Upgradeable contract']
      })
    };

    const riskyResult = await detector.analyzeToken('RUGPULL_TOKEN');
    console.log(`   Risk Score: ${riskyResult.riskScore}`);
    console.log(`   Risk Level: ${riskyResult.riskLevel}`);
    console.log(`   Red Flags: ${riskyResult.analysis.onChain.redFlags.length + 
                    riskyResult.analysis.social.redFlags.length + 
                    riskyResult.analysis.code.redFlags.length} total`);
    
    if (riskyResult.riskScore >= 80 && riskyResult.riskLevel === 'CRITICAL') {
      console.log('✅ High-risk token test passed\n');
    } else {
      console.log('❌ High-risk token test failed\n');
      return false;
    }
    
    // Restore original analyzers
    detector.chainAnalyzer = originalChainAnalyzer;
    
  } catch (error) {
    console.log('❌ High-risk token test failed:', error.message);
    return false;
  }

  // Test 4: Test error handling
  console.log('4. Testing error handling...');
  try {
    // Mock chain analyzer to throw an error
    const originalChainAnalyzer = detector.chainAnalyzer;
    detector.chainAnalyzer = {
      getTokenInfo: async () => { throw new Error('Token not found'); }
    };
    
    try {
      await detector.analyzeToken('INVALID_TOKEN');
      console.log('❌ Error handling test failed - should have thrown error');
      return false;
    } catch (error) {
      console.log('✅ Error handling test passed - correctly caught error');
    }
    
    // Restore original analyzers
    detector.chainAnalyzer = originalChainAnalyzer;
    
  } catch (error) {
    console.log('❌ Error handling test setup failed:', error.message);
    return false;
  }

  // Test 5: Test recommendation generation
  console.log('5. Testing recommendation generation...');
  try {
    const recommendations = detector.generateRecommendations(85, 
      { redFlags: ['Mint not renounced'] }, 
      { redFlags: [] }, 
      { redFlags: [] }
    );
    
    if (recommendations.includes('DO NOT BUY - HIGH RUG PULL RISK')) {
      console.log('✅ Recommendation generation test passed');
    } else {
      console.log('❌ Recommendation generation test failed');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Recommendation generation test failed:', error.message);
    return false;
  }

  // Test 6: Test summary generation
  console.log('6. Testing summary generation...');
  try {
    const summary = detector.generateSummary(75, 
      { redFlags: ['High concentration'] }, 
      { redFlags: ['Bot activity'] }, 
      { redFlags: [] }
    );
    
    if (summary.includes('HIGH RUG PULL RISK') && summary.includes('KEY RED FLAGS')) {
      console.log('✅ Summary generation test passed\n');
    } else {
      console.log('❌ Summary generation test failed\n');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Summary generation test failed:', error.message);
    return false;
  }

  console.log('🎉 All Functional Tests Passed!');
  console.log('Your Solana Rug Pull Detector is working correctly!\n');
  
  // Test 7: Integration test with real structure
  console.log('7. Testing complete integration flow...');
  try {
    // Create a realistic test scenario
    const testToken = 'TEST_TOKEN';
    const originalChainAnalyzer = detector.chainAnalyzer;
    
    // Mock all three layers with realistic data
    detector.chainAnalyzer = {
      getTokenInfo: async () => ({ symbol: 'TEST' }),
      analyzeTokenEconomics: async () => ({
        riskScore: 60,
        redFlags: ['LP not locked', 'Moderate concentration']
      })
    };
    
    detector.socialAnalyzer = {
      analyzeSocialSignals: async () => ({
        riskScore: 45,
        redFlags: ['Some suspicious activity']
      })
    };
    
    detector.codeAnalyzer = {
      analyzeCode: async () => ({
        riskScore: 30,
        redFlags: []
      })
    };

    const fullResult = await detector.analyzeToken(testToken);
    
    // Verify the weighted calculation: (60*0.5 + 45*0.3 + 30*0.2) = 30 + 13.5 + 6 = 49.5 ≈ 50
    const expectedScore = Math.round(60 * 0.5 + 45 * 0.3 + 30 * 0.2);
    
    if (Math.abs(fullResult.riskScore - expectedScore) <= 1) {
      console.log(`✅ Weighted scoring works correctly (${fullResult.riskScore} ≈ ${expectedScore})`);
      console.log(`   Final Risk Level: ${fullResult.riskLevel}\n`);
    } else {
      console.log(`❌ Weighted scoring failed (${fullResult.riskScore} vs ${expectedScore})`);
      return false;
    }
    
    detector.chainAnalyzer = originalChainAnalyzer;
    
  } catch (error) {
    console.log('❌ Integration test failed:', error.message);
    return false;
  }

  console.log('🏆 COMPREHENSIVE FUNCTIONAL TESTING COMPLETE!');
  console.log('Your project is ready for the Colosseum Agent Hackathon!');
  return true;
}

// Run the tests
runFunctionalTests().then(success => {
  if (success) {
    console.log('\n✅ ALL TESTS PASSED - Your submission is solid!');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED - Please review the issues above');
    process.exit(1);
  }
}).catch(error => {
  console.log('\n💥 UNEXPECTED ERROR:', error.message);
  process.exit(1);
});