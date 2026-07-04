'use client';
/**
 * web3 helpers — MetaMask (EVM) + Phantom (Solana), sem dependências extras.
 * WalletConnect e Coinbase Wallet ficam para v2 (precisam de SDKs adicionais).
 */

import { chainInfo, toHexChainId } from './chains';

// ─── Detecção ────────────────────────────────────────────────────────────────
export function detectWallets() {
  if (typeof window === 'undefined') return {};
  return {
    metamask: Boolean(window.ethereum?.isMetaMask || window.ethereum?.providers?.find(p => p.isMetaMask)),
    phantom:  Boolean(window.solana?.isPhantom),
    coinbase: Boolean(window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension),
    injected: Boolean(window.ethereum),
  };
}

function getEvmProvider() {
  if (typeof window === 'undefined') return null;
  if (window.ethereum?.providers?.length) {
    // Prefer MetaMask if multiple providers injected
    const mm = window.ethereum.providers.find(p => p.isMetaMask);
    return mm || window.ethereum.providers[0];
  }
  return window.ethereum || null;
}

// ─── Encode helpers ──────────────────────────────────────────────────────────
function toWeiHex(amountFloat, decimals = 18) {
  // Handle up to 8 decimal places safely without BigInt strings that overflow
  const [intPart, fracPart = ''] = String(amountFloat).split('.');
  const paddedFrac = (fracPart + '0'.repeat(decimals)).slice(0, decimals);
  const combined = (intPart + paddedFrac).replace(/^0+/, '') || '0';
  return '0x' + BigInt(combined).toString(16);
}

// ─── EVM ─────────────────────────────────────────────────────────────────────
export async function connectMetaMask(chainId, mode = 'testnet') {
  const provider = getEvmProvider();
  if (!provider) throw new Error('MetaMask não instalado. Instale em metamask.io');
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (chainId) await ensureNetwork(chainId, mode);
  const balance = await getEvmBalance(accounts[0]);
  return { account: accounts[0], balance, provider };
}

export async function ensureNetwork(chainKey, mode = 'testnet') {
  const provider = getEvmProvider();
  if (!provider) throw new Error('Provider ausente.');
  const net = chainInfo(chainKey, mode);
  if (!net || !net.chainId) throw new Error('Rede desconhecida.');
  const targetHex = toHexChainId(net.chainId);
  const current = await provider.request({ method: 'eth_chainId' });
  if (current === targetHex) return;
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetHex }],
    });
  } catch (err) {
    // If chain not added, add it
    if (err.code === 4902 || String(err.message || '').includes('Unrecognized chain')) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: targetHex,
          chainName: net.label || net.mainnet?.label || chainKey,
          nativeCurrency: { name: net.symbol, symbol: net.symbol, decimals: 18 },
          rpcUrls: [net.rpc],
          blockExplorerUrls: [net.explorer],
        }],
      });
    } else {
      throw err;
    }
  }
}

export async function getEvmBalance(address) {
  const provider = getEvmProvider();
  if (!provider || !address) return '0.0000';
  const balHex = await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] });
  const balWei = BigInt(balHex);
  // ETH has 18 decimals — display as ETH with 4 places
  const asFloat = Number(balWei) / 1e18;
  return asFloat.toFixed(4);
}

export async function sendEvmPayment({ to, amountFloat, decimals = 18, chainKey, mode = 'testnet' }) {
  const provider = getEvmProvider();
  if (!provider) throw new Error('Wallet EVM não conectada.');
  await ensureNetwork(chainKey, mode);
  const accounts = await provider.request({ method: 'eth_accounts' });
  const from = accounts[0];
  if (!from) throw new Error('Sem conta ativa.');
  const value = toWeiHex(amountFloat, decimals);
  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to, value }],
  });
  return txHash;
}

// ─── Solana (Phantom) ────────────────────────────────────────────────────────
export async function connectPhantom() {
  if (typeof window === 'undefined' || !window.solana?.isPhantom) {
    throw new Error('Phantom não instalado. Instale em phantom.app');
  }
  const resp = await window.solana.connect();
  const pubkey = resp.publicKey.toString();
  return { account: pubkey };
}

/**
 * Envia SOL via Phantom no cluster escolhido.
 * Usa fetch direto pro RPC (JSON-RPC) para evitar dependência de @solana/web3.js.
 */
export async function sendSolanaPayment({ to, amountFloat, mode = 'testnet' }) {
  if (typeof window === 'undefined' || !window.solana) throw new Error('Phantom ausente.');
  // Load @solana/web3.js on demand — se disponível
  let solWeb3;
  try {
    solWeb3 = await import('@solana/web3.js');
  } catch {
    throw new Error('Suporte Solana ainda não instalado. Rode `yarn add @solana/web3.js` primeiro.');
  }
  const c = chainInfo('solana', mode);
  const connection = new solWeb3.Connection(c.rpc, 'confirmed');
  const from = window.solana.publicKey;
  const toPubkey = new solWeb3.PublicKey(to);
  const lamports = Math.floor(amountFloat * solWeb3.LAMPORTS_PER_SOL);
  const tx = new solWeb3.Transaction().add(
    solWeb3.SystemProgram.transfer({ fromPubkey: from, toPubkey, lamports }),
  );
  tx.feePayer = from;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  const signed = await window.solana.signAndSendTransaction(tx);
  return signed.signature;
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
export async function payForOrder({ chainKey, amountFloat, mode = 'testnet' }) {
  const c = chainInfo(chainKey, mode);
  if (!c) throw new Error('Rede desconhecida: ' + chainKey);
  if (c.family === 'evm') {
    const txHash = await sendEvmPayment({
      to: c.recipient, amountFloat, decimals: 18, chainKey, mode,
    });
    return { txHash, family: 'evm', chainId: c.chainId };
  }
  if (c.family === 'solana') {
    const sig = await sendSolanaPayment({ to: c.recipient, amountFloat, mode });
    return { txHash: sig, family: 'solana' };
  }
  throw new Error('Família de chain não suportada: ' + c.family);
}

// ─── Cart helpers (localStorage) ─────────────────────────────────────────────
const CART_KEY = 'hub3.store.cart';

export function getCart() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
export function setCart(items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('hub3:cart-changed'));
}
export function clearCart() { setCart([]); }
