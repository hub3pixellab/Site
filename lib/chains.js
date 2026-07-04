/**
 * Chain configs — MAINNETS + TESTNETS.
 * Enquanto estamos em fase de testes, `defaultMode='testnet'`.
 * Hosts públicos gratuitos. Substituir por Infura/Alchemy se necessário.
 */

export const HUB3_WALLETS = {
  evm: process.env.NEXT_PUBLIC_HUB3_WALLET_EVM || '0x0000000000000000000000000000000000000000',
  solana: process.env.NEXT_PUBLIC_HUB3_WALLET_SOLANA || '',
  bitcoin: process.env.NEXT_PUBLIC_HUB3_WALLET_BITCOIN || '',
  tron: process.env.NEXT_PUBLIC_HUB3_WALLET_TRON || '',
};

export const CHAINS = {
  ethereum: {
    id: 'ethereum', label: 'Ethereum', symbol: 'ETH', decimals: 18, family: 'evm',
    emoji: '\u{1F535}', accent: '#627EEA',
    mainnet: { chainId: 1,        rpc: 'https://eth.llamarpc.com',      explorer: 'https://etherscan.io' },
    testnet: { chainId: 11155111, rpc: 'https://ethereum-sepolia-rpc.publicnode.com', explorer: 'https://sepolia.etherscan.io', label: 'Sepolia' },
    recipient: HUB3_WALLETS.evm,
  },
  bnb: {
    id: 'bnb', label: 'BNB Chain', symbol: 'BNB', decimals: 18, family: 'evm',
    emoji: '\u{1F7E1}', accent: '#F3BA2F',
    mainnet: { chainId: 56, rpc: 'https://bsc-dataseed1.binance.org', explorer: 'https://bscscan.com' },
    testnet: { chainId: 97, rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545', explorer: 'https://testnet.bscscan.com', label: 'BNB Testnet' },
    recipient: HUB3_WALLETS.evm,
  },
  polygon: {
    id: 'polygon', label: 'Polygon', symbol: 'MATIC', decimals: 18, family: 'evm',
    emoji: '\u{1F7E3}', accent: '#8247E5',
    mainnet: { chainId: 137,   rpc: 'https://polygon-rpc.com', explorer: 'https://polygonscan.com' },
    testnet: { chainId: 80002, rpc: 'https://rpc-amoy.polygon.technology', explorer: 'https://amoy.polygonscan.com', label: 'Polygon Amoy' },
    recipient: HUB3_WALLETS.evm,
  },
  arbitrum: {
    id: 'arbitrum', label: 'Arbitrum', symbol: 'ETH', decimals: 18, family: 'evm',
    emoji: '\u{1F535}', accent: '#28A0F0',
    mainnet: { chainId: 42161,  rpc: 'https://arb1.arbitrum.io/rpc', explorer: 'https://arbiscan.io' },
    testnet: { chainId: 421614, rpc: 'https://sepolia-rollup.arbitrum.io/rpc', explorer: 'https://sepolia.arbiscan.io', label: 'Arbitrum Sepolia' },
    recipient: HUB3_WALLETS.evm,
  },
  optimism: {
    id: 'optimism', label: 'Optimism', symbol: 'ETH', decimals: 18, family: 'evm',
    emoji: '\u{1F534}', accent: '#FF0420',
    mainnet: { chainId: 10,       rpc: 'https://mainnet.optimism.io', explorer: 'https://optimistic.etherscan.io' },
    testnet: { chainId: 11155420, rpc: 'https://sepolia.optimism.io', explorer: 'https://sepolia-optimism.etherscan.io', label: 'Optimism Sepolia' },
    recipient: HUB3_WALLETS.evm,
  },
  linea: {
    id: 'linea', label: 'Linea', symbol: 'ETH', decimals: 18, family: 'evm',
    emoji: '\u26AB', accent: '#61DFFF',
    mainnet: { chainId: 59144,   rpc: 'https://rpc.linea.build', explorer: 'https://lineascan.build' },
    testnet: { chainId: 59141,   rpc: 'https://rpc.sepolia.linea.build', explorer: 'https://sepolia.lineascan.build', label: 'Linea Sepolia' },
    recipient: HUB3_WALLETS.evm,
  },
  solana: {
    id: 'solana', label: 'Solana', symbol: 'SOL', decimals: 9, family: 'solana',
    emoji: '\u{1F7E3}', accent: '#9945FF',
    mainnet: { rpc: 'https://api.mainnet-beta.solana.com', explorer: 'https://solscan.io' },
    testnet: { rpc: 'https://api.devnet.solana.com', explorer: 'https://solscan.io/?cluster=devnet', label: 'Solana Devnet' },
    recipient: HUB3_WALLETS.solana,
  },
};

export const CHAIN_ORDER = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'linea', 'bnb', 'solana'];

export function getChain(id) { return CHAINS[id]; }

export function chainInfo(id, mode = 'testnet') {
  const c = CHAINS[id];
  if (!c) return null;
  const net = c[mode] || c.testnet;
  return { ...c, ...net, mode };
}

export function txExplorerUrl(chainId, txHash, mode = 'testnet') {
  const c = chainInfo(chainId, mode);
  if (!c) return '#';
  if (c.family === 'solana') return `${c.explorer.split('?')[0]}/tx/${txHash}${c.explorer.includes('?') ? c.explorer.slice(c.explorer.indexOf('?')) : ''}`;
  return `${c.explorer}/tx/${txHash}`;
}

// EVM chainId in hex — used by wallet_switchEthereumChain
export function toHexChainId(id) { return '0x' + Number(id).toString(16); }
