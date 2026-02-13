#!/usr/bin/env node

const ChainAnalyzer = require('./chainAnalyzer');
const SocialAnalyzer = require('./socialAnalyzer');
const CodeAnalyzer = require('./codeAnalyzer');

class RugPullDetector {
  constructor() {
    this.chainAnalyzer = new ChainAnalyzer();
    this.socialAnalyzer = new SocialAnalyzer();
    this.codeAnalyzer = new CodeAnalyzer();
  }

  /**
   * Main detection function - analyzes a token for rug pull risk
   * @param {string} tokenMint - Solana token mint address or symbol
   * @returns {Promise<Object>} - Risk assessment with score and details
   */
  async analyzeToken(tokenMint) {
    console.log(`🔍 Analyzing token: ${tokenMint}`);
    
    try {
      // Step 1: Get basic token info and validate
      const tokenInfo = await this.chainAnalyzer.getTokenInfo(tokenMint);
      if (!tokenInfo) {
        throw new Error('Token not found or invalid');
      }

      // Step 2: Run parallel analysis
      const [onChainResult, socialResult, codeResult] = await Promise.all([
        this.chainAnalyzer.analyzeTokenEconomics(tokenMint),
        this.socialAnalyzer.analyzeSocialSignals(tokenMint),
        this.codeAnalyzer.analyzeCode(tokenMint)
      ]);

      // Step 3: Calculate risk score
      const riskScore = this.calculateRiskScore(onChainResult, socialResult, codeResult);
      
      // Step 4: Generate recommendations
      const recommendations = this.generateRecommendations(riskScore, onChainResult, socialResult, codeResult);

      // Step 5: Compile final report
      const report = {
        token: tokenInfo.symbol || tokenMint,
        mintAddress: tokenMint,
        timestamp: new Date().toISOString(),
        riskScore: Math.round(riskScore),
        riskLevel: this.getRiskLevel(riskScore),
        analysis: {
          onChain: onChainResult,
          social: socialResult,
          code: codeResult
        },
        recommendations: recommendations,
        summary: this.generateSummary(riskScore, onChainResult, socialResult, codeResult)
      };

      console.log(`✅ Analysis complete for ${tokenMint} - Risk Score: ${riskScore}`);
      return report;

    } catch (error) {
      console.error(`❌ Error analyzing token ${tokenMint}:`, error.message);
      throw error;
    }
  }

  /**
   * Analyze token by symbol (for web dashboard compatibility)
   * @param {string} symbol - Token symbol
   * @returns {Promise<Object>} - Risk assessment
   */
  async analyzeTokenBySymbol(symbol) {
    // For hackathon demo, we'll simulate based on symbol
    // In production, this would resolve symbol to mint address
    console.log(`🔍 Analyzing token by symbol: ${symbol}`);
    
    // Simulate different risk levels based on symbol
    let mockMint = symbol.toLowerCase() + "_mint_address";
    
    if (symbol.toLowerCase().includes('fake') || symbol.toLowerCase().includes('rug')) {
      // High risk simulation
      return {
        tokenSymbol: symbol,
        riskScore: 92,
        riskLevel: 'CRITICAL',
        onChainIssues: ['Mint authority not renounced', 'Single wallet holds 95% supply'],
        socialIssues: ['Bot activity detected', 'Fake influencer campaigns'],
        codeIssues: ['Backdoor functions found', 'Upgradeable contract'],
        recommendations: ['DO NOT BUY - HIGH RUG PULL RISK', 'Avoid this token completely']
      };
    } else if (symbol.toLowerCase().includes('moon') || symbol.toLowerCase().includes('shot')) {
      // Medium-high risk
      return {
        tokenSymbol: symbol,
        riskScore: 78,
        riskLevel: 'HIGH',
        onChainIssues: ['LP tokens not locked', 'Anonymous team'],
        socialIssues: ['Suspicious Telegram activity'],
        codeIssues: [],
        recommendations: ['EXTREME CAUTION - High risk detected', 'Only invest what you can afford to lose']
      };
    } else {
      // Low risk simulation
      return {
        tokenSymbol: symbol,
        riskScore: 23,
        riskLevel: 'LOW',
        onChainIssues: [],
        socialIssues: [],
        codeIssues: [],
        recommendations: ['APPEARS LEGITIMATE - Low risk detected', 'Still exercise normal caution with new tokens']
      };
    }
  }

  /**
   * Calculate weighted risk score from all analysis components
   */
  calculateRiskScore(onChain, social, code) {
    // Weights: On-chain (50%), Social (30%), Code (20%)
    const onChainWeight = 0.5;
    const socialWeight = 0.3;
    const codeWeight = 0.2;

    const onChainScore = this.normalizeScore(onChain.riskScore || 0);
    const socialScore = this.normalizeScore(social.riskScore || 0);
    const codeScore = this.normalizeScore(code.riskScore || 0);

    return (onChainScore * onChainWeight) + 
           (socialScore * socialWeight) + 
           (codeScore * codeWeight);
  }

  /**
   * Normalize scores to 0-100 range
   */
  normalizeScore(score) {
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get risk level based on score
   */
  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'SAFE';
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(riskScore, onChain, social, code) {
    const recommendations = [];

    if (riskScore >= 80) {
      recommendations.push('DO NOT BUY - HIGH RUG PULL RISK');
      recommendations.push('Avoid this token completely');
    } else if (riskScore >= 60) {
      recommendations.push('EXTREME CAUTION - High risk detected');
      recommendations.push('Only invest what you can afford to lose');
    } else if (riskScore >= 40) {
      recommendations.push('MODERATE CAUTION - Some red flags present');
      recommendations.push('Research thoroughly before investing');
    } else {
      recommendations.push('APPEARS LEGITIMATE - Low risk detected');
      recommendations.push('Still exercise normal caution with new tokens');
    }

    // Add specific recommendations based on findings
    if (onChain.redFlags && onChain.redFlags.length > 0) {
      onChain.redFlags.forEach(flag => {
        if (flag.includes('mint authority')) {
          recommendations.push('Mint authority not renounced - unlimited token creation possible');
        }
        if (flag.includes('liquidity') || flag.includes('LP')) {
          recommendations.push('Liquidity not locked - developers can remove funds anytime');
        }
        if (flag.includes('concentration') || flag.includes('distribution')) {
          recommendations.push('High token concentration - single wallet controls majority supply');
        }
      });
    }

    if (social.redFlags && social.redFlags.length > 0) {
      recommendations.push('Social media shows suspicious activity');
    }

    if (code.redFlags && code.redFlags.length > 0) {
      recommendations.push('Contract contains potential vulnerabilities');
    }

    return recommendations;
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(riskScore, onChain, social, code) {
    const level = this.getRiskLevel(riskScore);
    let summary = `🚨 RUG PULL ALERT: This token has ${level} RUG PULL RISK (${Math.round(riskScore)}/100)\n\n`;

    // Add key findings
    const allRedFlags = [
      ...(onChain.redFlags || []),
      ...(social.redFlags || []),
      ...(code.redFlags || [])
    ];

    if (allRedFlags.length > 0) {
      summary += '🔴 KEY RED FLAGS:\n';
      allRedFlags.slice(0, 5).forEach(flag => {
        summary += `- ${flag}\n`;
      });
      if (allRedFlags.length > 5) {
        summary += `- ...and ${allRedFlags.length - 5} more issues\n`;
      }
      summary += '\n';
    }

    summary += '💡 RECOMMENDATION: ';
    if (riskScore >= 80) {
      summary += 'DO NOT BUY';
    } else if (riskScore >= 60) {
      summary += 'EXTREME CAUTION';
    } else if (riskScore >= 40) {
      summary += 'MODERATE CAUTION';
    } else {
      summary += 'APPEARS SAFE';
    }

    return summary;
  }

  /**
   * Monitor new tokens continuously
   */
  async monitorNewTokens() {
    console.log('📡 Starting continuous monitoring for new tokens...');
    
    // This would integrate with Raydium/Orca APIs to detect new pairs
    // For hackathon demo, we'll simulate with a basic interval
    setInterval(async () => {
      console.log('🔄 Checking for new suspicious tokens...');
      // In production: query DEX APIs for new pairs
      // For now: this is a placeholder
    }, 30000); // Check every 30 seconds
  }
}

// Export for use in other modules
module.exports = { RugPullDetector };