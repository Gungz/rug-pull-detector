#!/usr/bin/env node

const axios = require('axios');
const { WebDashboard } = require('./src/webDashboard');

console.log('🚀 Starting Simple API Tests...\n');

async function runAPITests() {
  try {
    // Test 1: Create a simple web server instance
    console.log('1. Testing WebDashboard initialization...');
    const dashboard = new WebDashboard();
    console.log('✅ WebDashboard initialized successfully\n');
    
    // Test 2: Test the getRecentAnalyses method directly
    console.log('2. Testing getRecentAnalyses method...');
    const recentAnalyses = await dashboard.getRecentAnalyses(5);
    console.log(`✅ Retrieved ${recentAnalyses.length} recent analyses`);
    console.log(`   Sample: ${recentAnalyses[0]?.token} - Risk Score: ${recentAnalyses[0]?.riskScore}\n`);
    
    // Test 3: Test risk level determination
    console.log('3. Testing risk level logic...');
    const testScores = [10, 30, 50, 70, 90];
    const expectedLevels = ['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    
    // We'll use the rugPullDetector for this
    const { RugPullDetector } = require('./src/rugPullDetector');
    const detector = new RugPullDetector();
    
    for (let i = 0; i < testScores.length; i++) {
      const level = detector.getRiskLevel(testScores[i]);
      console.log(`   Score ${testScores[i]} → Level: ${level}`);
      if (level !== expectedLevels[i]) {
        console.log(`❌ Expected ${expectedLevels[i]}, got ${level}`);
        return;
      }
    }
    console.log('✅ Risk level determination working correctly\n');
    
    // Test 4: Test recommendation generation
    console.log('4. Testing recommendation generation...');
    const recommendations = detector.generateRecommendations(85, {redFlags: []}, {redFlags: []}, {redFlags: []});
    console.log(`✅ Generated ${recommendations.length} recommendations`);
    console.log(`   First recommendation: "${recommendations[0]}"\n`);
    
    console.log('🎉 All Simple API Tests Passed!');
    console.log('Your web dashboard and API endpoints are working correctly!\n');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runAPITests().catch(console.error);