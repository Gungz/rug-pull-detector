const express = require('express');
const path = require('path');
const { RugPullDetector } = require('./rugPullDetector');

class WebDashboard {
    constructor() {
        this.app = express();
        this.detector = new RugPullDetector();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '../views'));
    }

    setupRoutes() {
        // Main dashboard
        this.app.get('/', async (req, res) => {
            try {
                const recentAnalyses = await this.getRecentAnalyses();
                res.render('index', { 
                    analyses: recentAnalyses,
                    title: 'Solana Rug Pull Detector - Real-time Protection'
                });
            } catch (error) {
                console.error('Dashboard error:', error);
                res.render('index', { analyses: [], title: 'Solana Rug Pull Detector' });
            }
        });

        // Token analysis page
        this.app.get('/token/:symbol', async (req, res) => {
            try {
                const { symbol } = req.params;
                const analysis = await this.detector.analyzeTokenBySymbol(symbol);
                
                if (!analysis) {
                    return res.status(404).render('404', { title: 'Token Not Found' });
                }

                res.render('token', { 
                    analysis,
                    title: `${symbol} - Risk Analysis`
                });
            } catch (error) {
                console.error('Token analysis error:', error);
                res.status(500).render('error', { 
                    message: 'Analysis failed',
                    title: 'Error'
                });
            }
        });

        // API endpoint for token check
        this.app.get('/api/check/:symbol', async (req, res) => {
            try {
                const { symbol } = req.params;
                const analysis = await this.detector.analyzeTokenBySymbol(symbol);
                res.json(analysis || { error: 'Token not found' });
            } catch (error) {
                console.error('API error:', error);
                res.status(500).json({ error: 'Analysis failed' });
            }
        });

        // API endpoint for bulk analysis
        this.app.post('/api/bulk-check', async (req, res) => {
            try {
                const { symbols } = req.body;
                if (!Array.isArray(symbols) || symbols.length === 0) {
                    return res.status(400).json({ error: 'Invalid symbols array' });
                }

                const results = [];
                for (const symbol of symbols.slice(0, 10)) { // Limit to 10 for rate limiting
                    try {
                        const analysis = await this.detector.analyzeTokenBySymbol(symbol);
                        results.push({ symbol, ...analysis });
                    } catch (err) {
                        results.push({ symbol, error: 'Analysis failed' });
                    }
                }

                res.json({ results });
            } catch (error) {
                console.error('Bulk API error:', error);
                res.status(500).json({ error: 'Bulk analysis failed' });
            }
        });

        // Live feed of recent detections
        this.app.get('/api/live-feed', async (req, res) => {
            try {
                const recent = await this.getRecentAnalyses(20);
                res.json({ detections: recent });
            } catch (error) {
                console.error('Live feed error:', error);
                res.status(500).json({ error: 'Failed to fetch live feed' });
            }
        });
    }

    async getRecentAnalyses(limit = 10) {
        // In a real implementation, this would query a database
        // For now, we'll simulate recent analyses
        return [
            {
                token: 'FAKETOKEN',
                symbol: 'FAKE',
                riskScore: 92,
                timestamp: new Date().toISOString(),
                redFlags: ['Mint authority not renounced', 'Single wallet holds 95% supply'],
                status: 'CRITICAL'
            },
            {
                token: 'MOONSHOT',
                symbol: 'MOON',
                riskScore: 78,
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                redFlags: ['LP tokens not locked', 'Anonymous team'],
                status: 'HIGH'
            },
            {
                token: 'LEGITCOIN',
                symbol: 'LEGIT',
                riskScore: 23,
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                redFlags: [],
                greenFlags: ['LP locked', 'Mint renounced', 'Audited'],
                status: 'LOW'
            }
        ].slice(0, limit);
    }

    start(port = 3000) {
        this.app.listen(port, () => {
            console.log(`🛡️  Rug Pull Detector Dashboard running on http://localhost:${port}`);
            console.log(`📱 Telegram Bot: @SolanaRugPullBot`);
            console.log(`📡 API Endpoint: /api/check/:symbol`);
        });
    }
}

module.exports = WebDashboard;