const axios = require('axios');
const { Connection, PublicKey } = require('@solana/web3.js');

class TokenResolver {
  constructor(rpcUrl = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.tokenLists = [
      'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json',
      'https://api.raydium.io/v2/sdk/token',
      'https://tokens.jup.ag/tokens'
    ];
    this.tokenCache = new Map();
  }

  /**
   * Resolve token symbol to mint address
   * @param {string} symbol - Token symbol (e.g., 'SOL', 'USDC', 'BONK')
   * @returns {Promise<string|null>} - Mint address or null if not found
   */
  async resolveSymbolToMint(symbol) {
    // Check cache first
    const cached = this.tokenCache.get(symbol.toLowerCase());
    if (cached) {
      return cached;
    }

    // Try multiple token lists
    for (const tokenListUrl of this.tokenLists) {
      try {
        const mintAddress = await this.searchTokenList(tokenListUrl, symbol);
        if (mintAddress) {
          this.tokenCache.set(symbol.toLowerCase(), mintAddress);
          return mintAddress;
        }
      } catch (error) {
        console.warn(`Failed to search token list ${tokenListUrl}:`, error.message);
        continue;
      }
    }

    // If all lists fail, try on-chain reverse lookup (expensive)
    try {
      const mintAddress = await this.reverseLookupOnChain(symbol);
      if (mintAddress) {
        this.tokenCache.set(symbol.toLowerCase(), mintAddress);
        return mintAddress;
      }
    } catch (error) {
      console.warn('On-chain reverse lookup failed:', error.message);
    }

    return null;
  }

  /**
   * Search a specific token list for the symbol
   */
  async searchTokenList(tokenListUrl, symbol) {
    try {
      const response = await axios.get(tokenListUrl, { timeout: 5000 });
      let tokens = [];

      // Handle different token list formats
      if (tokenListUrl.includes('solana-labs')) {
        // Official Solana token list format
        tokens = response.data.tokens || [];
      } else if (tokenListUrl.includes('raydium')) {
        // Raydium format
        tokens = Array.isArray(response.data) ? response.data : 
                (response.data?.data || response.data?.tokens || []);
      } else if (tokenListUrl.includes('jup.ag')) {
        // Jupiter format
        tokens = Array.isArray(response.data) ? response.data : Object.values(response.data);
      }

      // Search for exact match (case-insensitive)
      const token = tokens.find(t => 
        t.symbol?.toLowerCase() === symbol.toLowerCase() ||
        t.name?.toLowerCase() === symbol.toLowerCase()
      );

      if (token && token.address) {
        // Validate the mint address
        if (this.isValidPublicKey(token.address)) {
          return token.address;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to fetch token list ${tokenListUrl}: ${error.message}`);
    }
  }

  /**
   * Perform on-chain reverse lookup (fallback method)
   * This is expensive and should be used as last resort
   */
  async reverseLookupOnChain(symbol) {
    console.log(`⚠️ Performing expensive on-chain reverse lookup for ${symbol}`);
    
    // This is a simplified approach - in production, you'd want to:
    // 1. Query known token program accounts
    // 2. Filter by metadata that matches the symbol
    // 3. Verify the token is legitimate
    
    // For hackathon purposes, we'll return null for now
    // since on-chain reverse lookup is complex and expensive
    return null;
  }

  /**
   * Validate if a string is a valid Solana public key
   */
  isValidPublicKey(address) {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get token info by symbol
   */
  async getTokenInfoBySymbol(symbol) {
    const mintAddress = await this.resolveSymbolToMint(symbol);
    if (!mintAddress) {
      return null;
    }

    try {
      const tokenInfo = await this.connection.getTokenSupply(new PublicKey(mintAddress));
      return {
        symbol: symbol,
        mintAddress: mintAddress,
        totalSupply: tokenInfo.value.uiAmountString,
        decimals: tokenInfo.value.decimals
      };
    } catch (error) {
      console.error(`Failed to get token info for ${mintAddress}:`, error.message);
      return null;
    }
  }
}

module.exports = TokenResolver;