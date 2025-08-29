/**
 * Truffle configuration file for Organic Food Traceability System
 */

require('dotenv').config({ path: '../.env' });
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Set default mnemonic and provider URL if not provided in environment variables
const defaultMnemonic = 'test test test test test test test test test test test junk';
const defaultProviderUrl = 'http://127.0.0.1:8545';

// Use environment variables if available, otherwise use defaults
const mnemonic = process.env.MNEMONIC || defaultMnemonic;
const infuraKey = process.env.INFURA_KEY || '';

module.exports = {
  networks: {
    // Development network (local)
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*', // Match any network id
    },
    
    // Ropsten testnet
    ropsten: {
      provider: () => new HDWalletProvider(
        mnemonic, 
        `https://ropsten.infura.io/v3/${infuraKey}`
      ),
      network_id: 3,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    
    // Mainnet
    mainnet: {
      provider: () => new HDWalletProvider(
        mnemonic, 
        `https://mainnet.infura.io/v3/${infuraKey}`
      ),
      network_id: 1,
      gas: 5500000,
      gasPrice: 20000000000, // 20 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.8.17',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },

  // Plugins
  plugins: [
    'truffle-plugin-verify'
  ],

  // API keys for verification
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY || ''
  },
};