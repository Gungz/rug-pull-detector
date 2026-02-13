const { RugPullDetector } = require('../src/rugPullDetector');

// Mock the analyzer dependencies
jest.mock('../src/chainAnalyzer');
jest.mock('../src/socialAnalyzer'); 
jest.mock('../src/codeAnalyzer');

describe('RugPullDetector', () => {
  let detector;
  let mockChainAnalyzer;
  let mockSocialAnalyzer;
  let mockCodeAnalyzer;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create mock instances
    mockChainAnalyzer = {
      analyzeTokenEconomics: jest.fn(),
      getTokenInfo: jest.fn()
    };
    mockSocialAnalyzer = {
      analyzeSocialSignals: jest.fn()
    };
    mockCodeAnalyzer = {
      analyzeCode: jest.fn()
    };

    // Mock the constructors to return our mock instances
    const ChainAnalyzer = require('../src/chainAnalyzer');
    const SocialAnalyzer = require('../src/socialAnalyzer');
    const CodeAnalyzer = require('../src/codeAnalyzer');
    
    ChainAnalyzer.mockImplementation(() => mockChainAnalyzer);
    SocialAnalyzer.mockImplementation(() => mockSocialAnalyzer);
    CodeAnalyzer.mockImplementation(() => mockCodeAnalyzer);

    // Create the detector instance
    detector = new RugPullDetector();
  });

  describe('analyzeToken', () => {
    test('should analyze token successfully with all components', async () => {
      // Setup mock responses
      mockChainAnalyzer.getTokenInfo.mockResolvedValue({
        symbol: 'TEST',
        mintAddress: 'test-mint-address'
      });
      
      mockChainAnalyzer.analyzeTokenEconomics.mockResolvedValue({
        riskScore: 80,
        redFlags: ['Mint authority not renounced']
      });
      
      mockSocialAnalyzer.analyzeSocialSignals.mockResolvedValue({
        riskScore: 60,
        redFlags: ['Suspicious social activity']
      });
      
      mockCodeAnalyzer.analyzeCode.mockResolvedValue({
        riskScore: 40,
        redFlags: ['Potential backdoor function']
      });

      // Execute
      const result = await detector.analyzeToken('test-mint-address');

      // Verify
      expect(result).toBeDefined();
      expect(result.token).toBe('TEST');
      expect(result.riskScore).toBe(62); // Weighted average: (80*0.5 + 60*0.3 + 40*0.2) = 62
      expect(result.riskLevel).toBe('HIGH');
      expect(result.recommendations).toContain('EXTREME CAUTION - High risk detected');
    });

    test('should throw error when token not found', async () => {
      mockChainAnalyzer.getTokenInfo.mockResolvedValue(null);

      await expect(detector.analyzeToken('invalid-token'))
        .rejects
        .toThrow('Token not found or invalid');
    });

    test('should handle analysis errors gracefully', async () => {
      mockChainAnalyzer.getTokenInfo.mockResolvedValue({ symbol: 'TEST' });
      mockChainAnalyzer.analyzeTokenEconomics.mockRejectedValue(new Error('Chain analysis failed'));

      await expect(detector.analyzeToken('test-token'))
        .rejects
        .toThrow('Chain analysis failed');
    });
  });

  describe('calculateRiskScore', () => {
    test('should calculate weighted risk score correctly', () => {
      const onChain = { riskScore: 100 };
      const social = { riskScore: 50 };
      const code = { riskScore: 25 };

      const score = detector.calculateRiskScore(onChain, social, code);
      // Expected: (100 * 0.5) + (50 * 0.3) + (25 * 0.2) = 50 + 15 + 5 = 70
      expect(score).toBe(70);
    });

    test('should normalize scores to 0-100 range', () => {
      const onChain = { riskScore: 150 }; // Should be capped at 100
      const social = { riskScore: -10 };  // Should be floored at 0
      const code = { riskScore: 75 };

      const score = detector.calculateRiskScore(onChain, social, code);
      // Expected: (100 * 0.5) + (0 * 0.3) + (75 * 0.2) = 50 + 0 + 15 = 65
      expect(score).toBe(65);
    });
  });

  describe('getRiskLevel', () => {
    test('should return correct risk levels', () => {
      expect(detector.getRiskLevel(95)).toBe('CRITICAL');
      expect(detector.getRiskLevel(75)).toBe('HIGH');
      expect(detector.getRiskLevel(55)).toBe('MEDIUM');
      expect(detector.getRiskLevel(35)).toBe('LOW');
      expect(detector.getRiskLevel(10)).toBe('SAFE');
    });
  });

  describe('generateRecommendations', () => {
    test('should generate appropriate recommendations based on risk score', () => {
      const highRiskRecs = detector.generateRecommendations(85, {}, {}, {});
      expect(highRiskRecs).toContain('DO NOT BUY - HIGH RUG PULL RISK');

      const mediumRiskRecs = detector.generateRecommendations(55, {}, {}, {});
      expect(mediumRiskRecs).toContain('MODERATE CAUTION - Some red flags present');

      const lowRiskRecs = detector.generateRecommendations(15, {}, {}, {});
      expect(lowRiskRecs).toContain('APPEARS LEGITIMATE - Low risk detected');
    });

    test('should include specific recommendations based on red flags', () => {
      const onChain = { redFlags: ['mint authority not renounced'] };
      const social = { redFlags: ['suspicious activity'] };
      const code = { redFlags: ['vulnerabilities'] };

      const recs = detector.generateRecommendations(70, onChain, social, code);
      expect(recs).toContain('Mint authority not renounced - unlimited token creation possible');
      expect(recs).toContain('Social media shows suspicious activity');
      expect(recs).toContain('Contract contains potential vulnerabilities');
    });
  });
});