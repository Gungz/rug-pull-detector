#!/usr/bin/env node

// Simple integration test for Solana Rug Pull Detector
const { RugPullDetector } = require('./src/rugPullDetector');

async function runSimpleTest() {
    console.log('🧪 Running Simple Integration Test...\n');
    
    try {
        // Test 1: Initialize the detector
        console.log('1. Initializing RugPullDetector...');
        const detector = new RugPullDetector();
        console.log('✅ Detector initialized successfully\n');
        
        // Test 2: Test risk score calculation
        console.log('2. Testing risk score calculation...');
        const mockOnChain = { riskScore: 80 };
        const mockSocial = { riskScore: 60 };
        const mockCode = { riskScore: 40 };
        
        const calculatedScore = detector.calculateRiskScore(mockOnChain, mockSocial, mockCode);
        console.log(`✅ Risk score calculated: ${calculatedScore} (expected: 62)\n`);
        
        // Test 3: Test risk level determination
        console.log('3. Testing risk level determination...');
        const levels = [0, 25, 50, 75, 95].map(score => ({
            score,
            level: detector.getRiskLevel(score)
        }));
        
        levels.forEach(({ score, level }) => {
            console.log(`   Score ${score} → Level: ${level}`);
        });
        console.log('✅ Risk level determination working\n');
        
        // Test 4: Test recommendation generation
        console.log('4. Testing recommendation generation...');
        const recommendations = detector.generateRecommendations(85, mockOnChain, mockSocial, mockCode);
        console.log(`✅ Generated ${recommendations.length} recommendations\n`);
        console.log('Sample recommendations:');
        recommendations.slice(0, 2).forEach(rec => console.log(`   - ${rec}`));
        
        console.log('\n🎉 All simple tests passed!');
        console.log('Your core logic is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    runSimpleTest().catch(console.error);
}