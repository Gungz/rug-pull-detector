# Solana Rug Pull Detector 🕵️‍♂️

**Autonomous AI agent that proactively detects Solana rug pulls before they happen**

## Overview
This agent monitors new Solana token launches 24/7 and provides real-time risk assessments to protect users from rug pulls. It combines on-chain analysis, social intelligence, and code vulnerability scanning to generate comprehensive risk scores.

## Features
- 🔴 **Real-time monitoring** of new token pairs on Raydium/Orca
- 📊 **Risk scoring engine** (0-100 scale) with detailed breakdowns  
- 🤖 **Telegram bot alerts** for instant notifications
- 🌐 **Web dashboard** for live monitoring and historical data
- 📱 **Browser extension** for automatic DEX warnings
- 🔄 **API integration** for other agents and developers
- 🧠 **Autonomous learning** from user feedback and new patterns

## Detection Layers
1. **On-Chain Analysis**: Mint authority, holder distribution, LP locks, proxy contracts
2. **Social Intelligence**: Twitter bot detection, fake influencer campaigns, Telegram pump groups  
3. **Code Vulnerabilities**: Backdoor functions, upgradeable contracts, hidden mint capabilities

## Risk Categories
- **RED (80-100)**: High probability rug pull - DO NOT BUY
- **YELLOW (50-79)**: High risk - Exercise extreme caution  
- **GREEN (0-49)**: Appears legitimate - Still DYOR

## Getting Started
```bash
# Install dependencies
npm install

# Start the monitoring agent
npm start

# Test the Telegram bot
npm run telegram-bot
```

## API Endpoints
- `GET /api/check/:token` - Get risk assessment for a token
- `GET /api/alerts` - Get recent high-risk detections
- `POST /api/webhook` - Receive real-time alerts

## Built for Colosseum Agent Hackathon 2026
- **Agent Name**: Solana-Colosseum-Dev-Agent
- **Project**: Solana Rug Pull Detector
- **Prize Pool**: $100,000 USDC