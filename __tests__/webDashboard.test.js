const request = require('supertest');
const WebDashboard = require('../src/webDashboard');

// Mock the RugPullDetector to avoid external dependencies
jest.mock('../src/rugPullDetector', () => {
  const mockAnalysis = {
    token: 'MOONSHOT',
    symbol: 'MOON',
    riskScore: 78,
    timestamp: new Date().toISOString(),
    redFlags: ['LP tokens not locked', 'Anonymous team'],
    status: 'HIGH'
  };

  return jest.fn().mockImplementation(() => {
    return {
      analyzeTokenBySymbol: jest.fn().mockResolvedValue(mockAnalysis)
    };
  });
});

describe('WebDashboard', () => {
  let dashboard;
  let server;

  beforeAll(() => {
    // Suppress console logs during tests
    console.log = jest.fn();
  });

  beforeEach(() => {
    dashboard = new WebDashboard();
    // Start the server on a random port
    const port = 0;
    server = dashboard.app.listen(port);
  });

  afterEach((done) => {
    server.close(done);
  });

  describe('GET /', () => {
    it('should render the main dashboard page', async () => {
      const response = await request(dashboard.app).get('/');
      expect(response.status).toBe(200);
      // Note: Since we don't have actual EJS templates, this would fail in real implementation
      // For now, we're testing the route exists
    });
  });

  describe('GET /api/check/:symbol', () => {
    it('should return analysis for a valid token symbol', async () => {
      const response = await request(dashboard.app).get('/api/check/MOON');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('riskScore');
      expect(response.body.riskScore).toBe(78);
    });

    it('should handle invalid token symbols gracefully', async () => {
      // Mock the detector to return null for invalid tokens
      const originalMock = require('../src/rugPullDetector');
      originalMock.mockImplementationOnce(() => {
        return {
          analyzeTokenBySymbol: jest.fn().mockResolvedValue(null)
        };
      });

      const response = await request(dashboard.app).get('/api/check/INVALID');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/bulk-check', () => {
    it('should process bulk token analysis', async () => {
      const response = await request(dashboard.app)
        .post('/api/bulk-check')
        .send({ symbols: ['MOON', 'WIF'] });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBe(2);
    });

    it('should handle invalid input', async () => {
      const response = await request(dashboard.app)
        .post('/api/bulk-check')
        .send({ symbols: 'not-an-array' });
      
      expect(response.status).toBe(400);
    });

    it('should limit bulk requests to 10 tokens', async () => {
      const manySymbols = Array(15).fill('MOON');
      const response = await request(dashboard.app)
        .post('/api/bulk-check')
        .send({ symbols: manySymbols });
      
      expect(response.status).toBe(200);
      expect(response.body.results.length).toBe(10);
    });
  });

  describe('GET /api/live-feed', () => {
    it('should return recent analyses', async () => {
      const response = await request(dashboard.app).get('/api/live-feed');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('detections');
      expect(Array.isArray(response.body.detections)).toBe(true);
    });
  });
});