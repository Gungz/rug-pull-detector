#!/usr/bin/env node

const { RugPullDetector } = require('./rugPullDetector');
const { TelegramBot } = require('./telegramBot');
const { WebDashboard } = require('./webDashboard');

async function main() {
    console.log('🚀 Starting Solana Rug Pull Detector...');
    
    // Initialize core detection engine
    const detector = new RugPullDetector();
    
    // Initialize Telegram bot (if TELEGRAM_BOT_TOKEN is set)
    if (process.env.TELEGRAM_BOT_TOKEN) {
        const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, detector);
        await telegramBot.start();
        console.log('📱 Telegram bot started');
    }
    
    // Initialize web dashboard and API
    const dashboard = new WebDashboard(detector);
    await dashboard.start();
    console.log('🌐 Web dashboard started on http://localhost:3001');
    
    console.log('✅ Solana Rug Pull Detector is running!');
    console.log('Use /check [TOKEN] on Telegram or visit http://localhost:3001');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Solana Rug Pull Detector...');
    process.exit(0);
});

// Start the application
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };