const TelegramBot = require('../src/telegramBot');
const { RugPullDetector } = require('../src/rugPullDetector');

// Mock Telegraf
jest.mock('telegraf', () => {
  return {
    Telegraf: jest.fn().mockImplementation(() => {
      return {
        command: jest.fn(),
        on: jest.fn(),
        start: jest.fn(),
        launch: jest.fn(),
        stop: jest.fn()
      };
    })
  };
});

// Mock RugPullDetector
jest.mock('../src/rugPullDetector', () => {
  return {
    RugPullDetector: jest.fn().mockImplementation(() => {
      return {
        analyzeTokenBySymbol: jest.fn().mockResolvedValue({
          tokenSymbol: 'TEST',
          riskScore: 75,
          onChainIssues: ['Mint authority not renounced'],
          socialIssues: ['Suspicious social activity'],
          codeIssues: ['Potential backdoor function']
        })
      };
    })
  };
});

describe('TelegramBot', () => {
  let originalEnv;
  
  beforeEach(() => {
    originalEnv = process.env;
    process.env.TELEGRAM_BOT_TOKEN = 'test-token-123';
  });
  
  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });
  
  test('should initialize with valid token', () => {
    const bot = new TelegramBot();
    expect(bot.botToken).toBe('test-token-123');
    expect(bot.bot).not.toBeNull();
  });
  
  test('should not initialize without token', () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const bot = new TelegramBot();
    expect(bot.bot).toBeNull();
  });
  
  test('should get correct risk level', () => {
    const bot = new TelegramBot();
    expect(bot.getRiskLevel(90)).toBe('CRITICAL');
    expect(bot.getRiskLevel(70)).toBe('HIGH RISK');
    expect(bot.getRiskLevel(50)).toBe('MEDIUM RISK');
    expect(bot.getRiskLevel(30)).toBe('LOW RISK');
  });
  
  test('should get correct risk emoji', () => {
    const bot = new TelegramBot();
    expect(bot.getRiskEmoji('CRITICAL')).toBe('🚨');
    expect(bot.getRiskEmoji('HIGH RISK')).toBe('⚠️');
    expect(bot.getRiskEmoji('MEDIUM RISK')).toBe('🟡');
    expect(bot.getRiskEmoji('LOW RISK')).toBe('✅');
  });
  
  test('should get correct recommendation', () => {
    const bot = new TelegramBot();
    expect(bot.getRecommendation(90)).toBe('DO NOT BUY - HIGH RUG PULL RISK');
    expect(bot.getRecommendation(70)).toBe('EXTREME CAUTION - HIGH RISK');
    expect(bot.getRecommendation(50)).toBe('PROCEED WITH CAUTION');
    expect(bot.getRecommendation(30)).toBe('APPEARS LEGITIMATE - but always DYOR');
  });
});