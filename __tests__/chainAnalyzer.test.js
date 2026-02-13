const ChainAnalyzer = require('../src/chainAnalyzer');

// Mock the Solana web3.js dependencies
jest.mock('@solana/web3.js', () => {
  const mockPublicKey = jest.fn((address) => ({ toString: () => address }));
  return {
    Connection: jest.fn().mockImplementation(() => ({
      getTokenSupply: jest.fn().mockResolvedValue({ value: { uiAmountString: '1000000' } }),
      getAccountInfo: jest.fn().mockResolvedValue({
        data: {
          slice: jest.fn().mockReturnValue(new Array(32).fill(0)),
          readUInt8: jest.fn().mockReturnValue(9)
        }
      }),
      getTokenLargestAccounts: jest.fn().mockResolvedValue({
        value: [
          { address: { toString: () => 'holder1' } },
          { address: { toString: () => 'holder2' } },
          { address: { toString: () => 'holder3' } }
        ]
      }),
      getTokenAccountBalance: jest.fn().mockResolvedValue({ value: { uiAmount: 100000 } })
    }),
    PublicKey: mockPublicKey,
  };
});

jest.mock('@solana/spl-token', () => ({
  Token: jest.fn(),
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
}));

describe('ChainAnalyzer', () => {
  let chainAnalyzer;

  beforeEach(() => {
    chainAnalyzer = new ChainAnalyzer();
  });

  describe('analyzeMintAuthority', () => {
    test('should return high risk when mint authority is not renounced', () => {
      const tokenInfo = { mintAuthorityRenounced: false };
      const result = chainAnalyzer.analyzeMintAuthority(tokenInfo);
      
      expect(result.score).toBe(100);
      expect(result.issues).toContain('Mint authority not renounced - developers can create unlimited tokens');
      expect(result.description).toContain('HIGH RISK');
    });

    test('should return safe when mint authority is renounced', () => {
      const tokenInfo = { mintAuthorityRenounced: true };
      const result = chainAnalyzer.analyzeMintAuthority(tokenInfo);
      
      expect(result.score).toBe(0);
      expect(result.issues).toHaveLength(0);
      expect(result.description).toContain('safe from unlimited minting');
    });
  });

  describe('analyzeHolderConcentration', () => {
    test('should return critical risk for extreme concentration', () => {
      const holders = [
        { percentage: 50 },
        { percentage: 30 },
        { percentage: 20 }
      ];
      const result = chainAnalyzer.analyzeHolderConcentration(holders);
      
      expect(result.score).toBe(100);
      expect(result.issues[0]).toContain('Top 3 wallets hold 100.0% of supply - extreme concentration');
    });

    test('should return safe for good distribution', () => {
      const holders = [
        { percentage: 20 },
        { percentage: 15 },
        { percentage: 10 }
      ];
      const result = chainAnalyzer.analyzeHolderConcentration(holders);
      
      expect(result.score).toBe(0);
      expect(result.description).toContain('Good holder distribution');
    });
  });

  describe('analyzeLiquidityPool', () => {
    test('should return high risk when LP is not locked', () => {
      const lpInfo = { lpLocked: false };
      const result = chainAnalyzer.analyzeLiquidityPool(lpInfo);
      
      expect(result.score).toBe(100);
      expect(result.issues).toContain('Liquidity pool not locked - developers can remove all liquidity instantly');
    });

    test('should return safe when LP is locked', () => {
      const lpInfo = { lpLocked: true };
      const result = chainAnalyzer.analyzeLiquidityPool(lpInfo);
      
      expect(result.score).toBe(0);
      expect(result.description).toContain('Liquidity pool locked - safe from rug pull');
    });
  });

  describe('getRiskLevel', () => {
    test('should return CRITICAL for score >= 80', () => {
      expect(chainAnalyzer.getRiskLevel(95)).toBe('CRITICAL');
      expect(chainAnalyzer.getRiskLevel(80)).toBe('CRITICAL');
    });

    test('should return HIGH for score >= 60', () => {
      expect(chainAnalyzer.getRiskLevel(75)).toBe('HIGH');
      expect(chainAnalyzer.getRiskLevel(60)).toBe('HIGH');
    });

    test('should return SAFE for score < 20', () => {
      expect(chainAnalyzer.getRiskLevel(15)).toBe('SAFE');
      expect(chainAnalyzer.getRiskLevel(0)).toBe('SAFE');
    });
  });
});