const { Connection, PublicKey } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

class ChainAnalyzer {
  constructor(rpcUrl = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Analyze a token for rug pull indicators
   * @param {string} tokenMintAddress - The token mint address to analyze
   * @returns {Promise<Object>} - Risk analysis results
   */
  async analyzeToken(tokenMintAddress) {
    try {
      const mintPublicKey = new PublicKey(tokenMintAddress);
      
      // Get token info
      const tokenInfo = await this.getTokenInfo(mintPublicKey);
      const holderDistribution = await this.getHolderDistribution(mintPublicKey);
      const lpInfo = await this.getLiquidityPoolInfo(tokenMintAddress);
      
      // Calculate risk scores
      const mintRisk = this.analyzeMintAuthority(tokenInfo);
      const holderRisk = this.analyzeHolderConcentration(holderDistribution);
      const lpRisk = this.analyzeLiquidityPool(lpInfo);
      
      const totalRiskScore = Math.round(
        (mintRisk.score * 0.4) + 
        (holderRisk.score * 0.35) + 
        (lpRisk.score * 0.25)
      );
      
      return {
        tokenAddress: tokenMintAddress,
        timestamp: new Date().toISOString(),
        riskScore: totalRiskScore,
        riskLevel: this.getRiskLevel(totalRiskScore),
        analysis: {
          mintAuthority: mintRisk,
          holderDistribution: holderRisk,
          liquidityPool: lpRisk
        },
        recommendations: this.generateRecommendations(totalRiskScore, mintRisk, holderRisk, lpRisk)
      };
    } catch (error) {
      console.error('Error analyzing token:', error);
      throw new Error(`Failed to analyze token ${tokenMintAddress}: ${error.message}`);
    }
  }

  /**
   * Get basic token information
   */
  async getTokenInfo(mintPublicKey) {
    try {
      const mintInfo = await this.connection.getTokenSupply(mintPublicKey);
      const accountInfo = await this.connection.getAccountInfo(mintPublicKey);
      
      // Check if mint authority exists (not renounced)
      const mintAuthorityRenounced = !accountInfo?.data?.slice(36, 68).some(byte => byte !== 0);
      
      return {
        totalSupply: mintInfo.value.uiAmountString,
        mintAuthorityRenounced: mintAuthorityRenounced,
        decimals: accountInfo?.data?.readUInt8(44)
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return {
        totalSupply: null,
        mintAuthorityRenounced: false,
        decimals: null
      };
    }
  }

  /**
   * Analyze mint authority risk
   */
  analyzeMintAuthority(tokenInfo) {
    const score = tokenInfo.mintAuthorityRenounced ? 0 : 100;
    const issues = [];
    
    if (!tokenInfo.mintAuthorityRenounced) {
      issues.push('Mint authority not renounced - developers can create unlimited tokens');
    }
    
    return {
      score: score,
      issues: issues,
      description: tokenInfo.mintAuthorityRenounced ? 
        '✅ Mint authority renounced - safe from unlimited minting' :
        '🔴 Mint authority NOT renounced - HIGH RISK'
    };
  }

  /**
   * Get top token holders distribution
   */
  async getHolderDistribution(mintPublicKey) {
    try {
      const largestAccounts = await this.connection.getTokenLargestAccounts(mintPublicKey);
      const holders = [];
      
      for (const account of largestAccounts.value.slice(0, 10)) {
        const accountInfo = await this.connection.getTokenAccountBalance(account.address);
        holders.push({
          address: account.address.toString(),
          amount: accountInfo.value.uiAmount,
          percentage: 0 // Will calculate below
        });
      }
      
      // Calculate percentages
      const totalTracked = holders.reduce((sum, holder) => sum + (holder.amount || 0), 0);
      holders.forEach(holder => {
        holder.percentage = totalTracked > 0 ? (holder.amount / totalTracked) * 100 : 0;
      });
      
      return holders;
    } catch (error) {
      console.error('Error getting holder distribution:', error);
      return [];
    }
  }

  /**
   * Analyze holder concentration risk
   */
  analyzeHolderConcentration(holders) {
    if (holders.length === 0) {
      return { score: 50, issues: ['Could not analyze holder distribution'], description: '⚠️ Unknown holder distribution' };
    }
    
    const top3Percentage = holders.slice(0, 3).reduce((sum, holder) => sum + holder.percentage, 0);
    let score = 0;
    const issues = [];
    
    if (top3Percentage > 90) {
      score = 100;
      issues.push(`Top 3 wallets hold ${top3Percentage.toFixed(1)}% of supply - extreme concentration`);
    } else if (top3Percentage > 70) {
      score = 75;
      issues.push(`Top 3 wallets hold ${top3Percentage.toFixed(1)}% of supply - high concentration`);
    } else if (top3Percentage > 50) {
      score = 50;
      issues.push(`Top 3 wallets hold ${top3Percentage.toFixed(1)}% of supply - moderate concentration`);
    } else {
      score = 0;
    }
    
    const description = score === 0 ? 
      '✅ Good holder distribution - decentralized ownership' :
      `🔴 High holder concentration - ${issues[0]}`;
    
    return {
      score: score,
      issues: issues,
      description: description,
      topHolders: holders.slice(0, 5)
    };
  }

  /**
   * Get liquidity pool information (simplified for now)
   * In production, this would integrate with Raydium/Orca APIs
   */
  async getLiquidityPoolInfo(tokenMintAddress) {
    // For hackathon MVP, we'll simulate LP analysis
    // In real implementation, this would check actual LP pools
    return {
      lpLocked: Math.random() > 0.7, // Simulate 70% chance of being locked
      lpAmount: Math.random() * 1000000, // Simulated LP amount
      poolAddress: null
    };
  }

  /**
   * Analyze liquidity pool risk
   */
  analyzeLiquidityPool(lpInfo) {
    const score = lpInfo.lpLocked ? 0 : 100;
    const issues = [];
    
    if (!lpInfo.lpLocked) {
      issues.push('Liquidity pool not locked - developers can remove all liquidity instantly');
    }
    
    return {
      score: score,
      issues: issues,
      description: lpInfo.lpLocked ? 
        '✅ Liquidity pool locked - safe from rug pull' :
        '🔴 Liquidity pool NOT locked - HIGH RISK'
    };
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
  generateRecommendations(totalScore, mintRisk, holderRisk, lpRisk) {
    const recommendations = [];
    
    if (totalScore >= 80) {
      recommendations.push('🚨 DO NOT BUY - Extremely high rug pull risk');
      recommendations.push('💡 Wait for proper audits and LP locking before considering');
    } else if (totalScore >= 60) {
      recommendations.push('⚠️ HIGH RISK - Exercise extreme caution');
      recommendations.push('💡 Only invest what you can afford to lose completely');
    } else if (totalScore >= 40) {
      recommendations.push('🟡 MEDIUM RISK - Proceed with caution');
      recommendations.push('💡 Monitor closely and set stop-losses if trading');
    } else {
      recommendations.push('✅ Appears legitimate - but always DYOR');
      recommendations.push('💡 Consider waiting for community adoption before large positions');
    }
    
    // Add specific recommendations based on issues found
    if (!mintRisk.description.includes('✅')) {
      recommendations.push('🔍 Verify mint authority is renounced before any investment');
    }
    if (holderRisk.score > 50) {
      recommendations.push('🔍 Monitor top wallet movements for potential dumps');
    }
    if (!lpRisk.description.includes('✅')) {
      recommendations.push('🔍 Confirm LP tokens are locked in a reputable locker');
    }
    
    return recommendations;
  }
}

module.exports = ChainAnalyzer;