const { Telegraf } = require('telegraf');
const RugPullDetector = require('./rugPullDetector');

class TelegramBot {
    constructor() {
        // Initialize bot with your Telegram bot token
        // This will be configured via environment variables
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!this.botToken) {
            console.warn('TELEGRAM_BOT_TOKEN not set. Telegram bot will not start.');
            this.bot = null;
            return;
        }
        
        this.bot = new Telegraf(this.botToken);
        this.detector = new RugPullDetector();
        this.setupCommands();
    }

    setupCommands() {
        if (!this.bot) return;

        // Main command: /check <token_symbol>
        this.bot.command('check', async (ctx) => {
            try {
                const tokenSymbol = ctx.message.text.split(' ')[1];
                if (!tokenSymbol) {
                    return ctx.reply('Usage: /check <TOKEN_SYMBOL>\nExample: /check MOONSHOT');
                }

                await ctx.reply(`🔍 Analyzing $${tokenSymbol.toUpperCase()}...`);

                // Perform rug pull detection
                const result = await this.detector.analyzeTokenBySymbol(tokenSymbol.toUpperCase());
                
                if (!result) {
                    return ctx.reply(`❌ Token $${tokenSymbol.toUpperCase()} not found or analysis failed.`);
                }

                // Format the response
                const riskLevel = this.getRiskLevel(result.riskScore);
                const emoji = this.getRiskEmoji(riskLevel);
                
                let message = `${emoji} **RUG PULL ANALYSIS: $${result.tokenSymbol}**\n\n`;
                message += `📊 **Risk Score: ${result.riskScore}/100** (${riskLevel})\n\n`;

                // Add on-chain issues
                if (result.onChainIssues.length > 0) {
                    message += `🔴 **ON-CHAIN ISSUES:**\n`;
                    result.onChainIssues.forEach(issue => {
                        message += `• ${issue}\n`;
                    });
                    message += `\n`;
                }

                // Add social issues  
                if (result.socialIssues.length > 0) {
                    message += `🟡 **SOCIAL RED FLAGS:**\n`;
                    result.socialIssues.forEach(issue => {
                        message += `• ${issue}\n`;
                    });
                    message += `\n`;
                }

                // Add code issues
                if (result.codeIssues.length > 0) {
                    message += `🟠 **CODE VULNERABILITIES:**\n`;
                    result.codeIssues.forEach(issue => {
                        message += `• ${issue}\n`;
                    });
                    message += `\n`;
                }

                // Recommendation
                message += `💡 **RECOMMENDATION: ${this.getRecommendation(result.riskScore)}**`;

                await ctx.reply(message, { parse_mode: 'Markdown' });

            } catch (error) {
                console.error('Telegram bot error:', error);
                await ctx.reply('❌ Error analyzing token. Please try again later.');
            }
        });

        // Help command
        this.bot.command('help', (ctx) => {
            const helpMessage = `
🛡️ **Solana Rug Pull Detector Bot**

Available commands:
• /check <TOKEN> - Analyze token for rug pull risk
• /alerts - Get info about real-time alerts  
• /help - Show this help message

Examples:
• /check MOONSHOT
• /check WIF

⚠️ **Disclaimer**: This is an automated analysis. Always do your own research!
            `;
            ctx.reply(helpMessage, { parse_mode: 'Markdown' });
        });

        // Alerts info
        this.bot.command('alerts', (ctx) => {
            const alertMessage = `
🔔 **Real-Time Alerts**

Our system monitors new Solana tokens 24/7 and automatically sends alerts for HIGH RISK tokens (score > 80).

To receive automatic alerts:
1. Make sure you have private messages enabled
2. We'll send alerts when dangerous tokens are detected

You can also check any token manually using /check command.
            `;
            ctx.reply(alertMessage, { parse_mode: 'Markdown' });
        });

        // Start message
        this.bot.start((ctx) => {
            const startMessage = `
👋 **Welcome to Solana Rug Pull Detector!**

I'm an autonomous AI agent that helps you avoid rug pulls on Solana.

Use /check <TOKEN_SYMBOL> to analyze any token before buying.

Example: /check BONK

Stay safe! 🛡️
            `;
            ctx.reply(startMessage, { parse_mode: 'Markdown' });
        });

        // Handle text messages (token symbols)
        this.bot.on('text', async (ctx) => {
            const text = ctx.message.text.trim();
            // If message looks like a token symbol (mostly letters, reasonable length)
            if (/^[A-Z]{3,12}$/.test(text)) {
                try {
                    await ctx.reply(`🔍 Analyzing $${text}...`);
                    const result = await this.detector.analyzeTokenBySymbol(text);
                    if (result) {
                        const riskLevel = this.getRiskLevel(result.riskScore);
                        const emoji = this.getRiskEmoji(riskLevel);
                        await ctx.reply(`${emoji} $${text} Risk Score: ${result.riskScore}/100 (${riskLevel})\n\n💡 ${this.getRecommendation(result.riskScore)}`);
                    }
                } catch (error) {
                    // Silent fail for random text messages
                }
            }
        });
    }

    getRiskLevel(score) {
        if (score >= 80) return 'CRITICAL';
        if (score >= 60) return 'HIGH RISK';
        if (score >= 40) return 'MEDIUM RISK';
        return 'LOW RISK';
    }

    getRiskEmoji(level) {
        switch(level) {
            case 'CRITICAL': return '🚨';
            case 'HIGH RISK': return '⚠️';
            case 'MEDIUM RISK': return '🟡';
            default: return '✅';
        }
    }

    getRecommendation(score) {
        if (score >= 80) return 'DO NOT BUY - HIGH RUG PULL RISK';
        if (score >= 60) return 'EXTREME CAUTION - HIGH RISK';
        if (score >= 40) return 'PROCEED WITH CAUTION';
        return 'APPEARS LEGITIMATE - but always DYOR';
    }

    async start() {
        if (!this.bot) {
            console.log('Telegram bot not configured (missing TELEGRAM_BOT_TOKEN)');
            return;
        }
        
        try {
            await this.bot.launch();
            console.log('✅ Telegram bot started successfully!');
            
            // Enable graceful stop
            process.once('SIGINT', () => this.bot.stop('SIGINT'));
            process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
            
        } catch (error) {
            console.error('❌ Failed to start Telegram bot:', error.message);
            if (error.message.includes('401')) {
                console.error('💡 Make sure TELEGRAM_BOT_TOKEN is set correctly in .env file');
            }
        }
    }

    async stop() {
        if (this.bot) {
            await this.bot.stop();
        }
    }
}

module.exports = TelegramBot;