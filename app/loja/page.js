'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Wallet, X, Plus, Minus, Trash2, Check, Loader2,
  ExternalLink, AlertTriangle, ChevronDown, Sparkles, Store as StoreIcon,
} from 'lucide-react';
import GameContainer from '@/components/ui/GameContainer';
import { CHAINS, CHAIN_ORDER, chainInfo, txExplorerUrl } from '@/lib/chains';
import {
  detectWallets, connectMetaMask, connectPhantom, getEvmBalance,
  payForOrder, getCart, setCart, clearCart,
} from '@/lib/web3';

const MODE = 'testnet'; // hard-coded para segurança na V1

const CATEGORIES = [
  { id: 'all',      label: 'Todos' },
  { id: 'services', label: 'Serviços' },
  { id: 'software', label: 'Software' },
  { id: 'nft',      label: 'NFT' },
  { id: 'hardware', label: 'Hardware' },
];

function short(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default function LojaPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('seed');
  const [category, setCategory] = useState('all');

  const [chainKey, setChainKey] = useState('polygon'); // default cheapest testnet
  const [walletType, setWalletType] = useState(null);  // 'metamask' | 'phantom'
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0.0000');
  const [wallets, setWallets] = useState({});

  const [cart, setCartState] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState('idle'); // idle | signing | confirming | success | error
  const [checkoutErr, setCheckoutErr] = useState('');
  const [lastTx, setLastTx] = useState(null); // { hash, chain, explorerLink }
  const [buyerEmail, setBuyerEmail] = useState('');

  const activeChain = chainInfo(chainKey, MODE);

  // Load products
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/store/products');
        const data = await res.json();
        if (alive) {
          setProducts(data.products || []);
          setSource(data.source || 'seed');
        }
      } catch { /* seed already fallback */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  // Detect wallets on mount
  useEffect(() => {
    setWallets(detectWallets());
    setCartState(getCart());
    const onCartChange = () => setCartState(getCart());
    window.addEventListener('hub3:cart-changed', onCartChange);
    return () => window.removeEventListener('hub3:cart-changed', onCartChange);
  }, []);

  // Refresh balance when chain/account changes
  useEffect(() => {
    if (!account || walletType !== 'metamask') return;
    getEvmBalance(account).then(setBalance).catch(() => {});
  }, [account, chainKey, walletType]);

  const filtered = useMemo(
    () => category === 'all' ? products : products.filter(p => p.category === category),
    [products, category]
  );

  const totalNative = useMemo(() => {
    return cart.reduce((sum, item) => {
      const p = products.find(x => x.id === item.id);
      if (!p) return sum;
      const priceN = p.priceByChain?.[chainKey] || 0;
      return sum + priceN * (item.quantity || 1);
    }, 0);
  }, [cart, products, chainKey]);

  const totalUSD = useMemo(() => {
    return cart.reduce((sum, item) => {
      const p = products.find(x => x.id === item.id);
      if (!p) return sum;
      return sum + (p.priceUSD || 0) * (item.quantity || 1);
    }, 0);
  }, [cart, products]);

  const addToCart = useCallback((product) => {
    const current = getCart();
    const existing = current.find(x => x.id === product.id);
    let next;
    if (existing) {
      next = current.map(x => x.id === product.id ? { ...x, quantity: (x.quantity || 1) + 1 } : x);
    } else {
      next = [...current, { id: product.id, name: product.name, emoji: product.emoji, quantity: 1 }];
    }
    setCart(next);
    setCartState(next);
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id) => {
    const next = getCart().filter(x => x.id !== id);
    setCart(next); setCartState(next);
  }, []);

  const changeQty = useCallback((id, delta) => {
    const cur = getCart();
    const idx = cur.findIndex(x => x.id === id);
    if (idx < 0) return;
    const q = (cur[idx].quantity || 1) + delta;
    if (q <= 0) {
      const next = cur.filter(x => x.id !== id);
      setCart(next); setCartState(next);
    } else {
      const next = cur.map((x, i) => i === idx ? { ...x, quantity: q } : x);
      setCart(next); setCartState(next);
    }
  }, []);

  const doConnectMetaMask = async () => {
    try {
      const { account: a, balance: b } = await connectMetaMask(chainKey, MODE);
      setAccount(a); setBalance(b); setWalletType('metamask');
    } catch (err) { alert(err.message); }
  };
  const doConnectPhantom = async () => {
    try {
      const { account: a } = await connectPhantom();
      setAccount(a); setWalletType('phantom'); setChainKey('solana');
    } catch (err) { alert(err.message); }
  };

  const doDisconnect = () => { setAccount(null); setWalletType(null); setBalance('0.0000'); };

  const submitCheckout = async () => {
    if (!account || !cart.length) return;
    // Guard: solana wallet must pay on solana chain, evm on evm chain
    if (walletType === 'metamask' && activeChain.family !== 'evm') {
      setCheckoutErr('MetaMask paga apenas em redes EVM. Troque para Solana com Phantom ou volte para EVM.');
      setCheckoutStatus('error'); return;
    }
    if (walletType === 'phantom' && activeChain.family !== 'solana') {
      setCheckoutErr('Phantom paga apenas em Solana.');
      setCheckoutStatus('error'); return;
    }
    setCheckoutErr('');
    setCheckoutStatus('signing');
    try {
      const { txHash } = await payForOrder({ chainKey, amountFloat: totalNative, mode: MODE });
      setCheckoutStatus('confirming');
      // Log order
      const items = cart.map(it => {
        const p = products.find(x => x.id === it.id);
        return {
          id: it.id, name: p?.name || it.name, emoji: p?.emoji || it.emoji,
          quantity: it.quantity, priceNative: p?.priceByChain?.[chainKey] || 0,
        };
      });
      const logRes = await fetch('/api/store/order', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          chain: chainKey, mode: MODE, txHash, from: account, items,
          subtotalNative: totalNative, totalNative,
          symbol: activeChain.symbol, priceUSD: totalUSD, buyerEmail,
        }),
      });
      const logData = await logRes.json();
      setLastTx({
        hash: txHash, chain: chainKey,
        explorerLink: logData.explorerLink || txExplorerUrl(chainKey, txHash, MODE),
      });
      setCheckoutStatus('success');
      clearCart(); setCartState([]);
    } catch (err) {
      setCheckoutErr(err.message || 'Falha na transação.');
      setCheckoutStatus('error');
    }
  };

  const cartCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

  return (
    <GameContainer>
      {/* Testnet banner */}
      <div className="max-w-5xl mx-auto mb-4">
        <div className="rounded-md px-3 py-2 font-mono text-[11px] tracking-widest flex items-center gap-2"
          style={{ background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.35)', color:'#FF6B35' }}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>TESTNET MODE · pagamentos executados em redes de teste (Sepolia · Amoy · Devnet). Sem dinheiro real.</span>
        </div>
      </div>

      {/* Header */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="max-w-5xl mx-auto text-center mb-6">
        <p className="font-mono text-xs tracking-[0.3em] text-hubOrange mb-2">
          <Sparkles className="inline w-3 h-3 mr-1" /> HUB3 · STORE
        </p>
        <h1 className="font-display text-3xl md:text-5xl gradient-text" data-testid="loja-title">
          Loja HUB3
        </h1>
        <p className="mt-3 font-mono text-xs md:text-sm text-cyanElectric tracking-widest">
          MULTI-CHAIN · {source === 'sanity' ? 'SANITY CMS' : 'CATÁLOGO INICIAL'}
        </p>
      </motion.div>

      {/* Wallet + Chain header */}
      <div className="max-w-5xl mx-auto glass rounded-xl border border-white/10 p-3 md:p-4 mb-6 flex flex-wrap items-center gap-3">
        {/* Chain selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest text-foreground/50">REDE</span>
          <div className="relative">
            <select
              value={chainKey}
              onChange={e => setChainKey(e.target.value)}
              data-testid="store-chain-select"
              className="bg-white/5 border border-cyanElectric/40 rounded-md pl-3 pr-8 py-1.5 font-mono text-xs text-cyanElectric focus:outline-none appearance-none cursor-pointer"
            >
              {CHAIN_ORDER.map(cid => {
                const c = CHAINS[cid];
                return <option key={cid} value={cid} style={{background:'#0b0914'}}>{c.emoji} {c.label} ({c.symbol})</option>;
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-cyanElectric pointer-events-none" />
          </div>
        </div>

        {/* Wallet actions */}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {!account ? (
            <>
              <button
                onClick={doConnectMetaMask}
                disabled={!wallets.injected}
                data-testid="store-connect-metamask"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-[11px] tracking-widest bg-hubOrange/10 border border-hubOrange/50 text-hubOrange hover:bg-hubOrange/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={wallets.injected ? 'Conectar MetaMask' : 'MetaMask não detectado'}
              >
                <Wallet className="w-3.5 h-3.5" /> METAMASK
              </button>
              <button
                onClick={doConnectPhantom}
                disabled={!wallets.phantom}
                data-testid="store-connect-phantom"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-[11px] tracking-widest bg-magenta/10 border border-magenta/50 text-magenta hover:bg-magenta/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={wallets.phantom ? 'Conectar Phantom' : 'Phantom não detectado'}
              >
                <Wallet className="w-3.5 h-3.5" /> PHANTOM
              </button>
              <span className="font-mono text-[10px] tracking-widest text-foreground/40 hidden md:inline">
                COINBASE / WALLETCONNECT em breve
              </span>
            </>
          ) : (
            <>
              <span className="font-mono text-[11px] text-acidGreen tracking-widest" data-testid="store-wallet-addr">
                <Check className="inline w-3 h-3 mr-1" />{short(account)}
              </span>
              {walletType === 'metamask' && (
                <span className="font-mono text-[11px] text-cyanElectric tracking-widest">
                  {balance} {activeChain.symbol}
                </span>
              )}
              <button
                onClick={doDisconnect}
                className="inline-flex items-center px-2 py-1 rounded-md font-mono text-[10px] tracking-widest text-foreground/50 border border-white/10 hover:border-white/30 transition-all"
              >
                DISCONNECT
              </button>
            </>
          )}

          {/* Cart toggle */}
          <button
            onClick={() => setCartOpen(true)}
            data-testid="store-cart-btn"
            className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-[11px] tracking-widest bg-cyanElectric/10 border border-cyanElectric/50 text-cyanElectric hover:bg-cyanElectric/20 transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> CARRINHO
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full bg-magenta text-[10px] font-bold text-white flex items-center justify-center" data-testid="store-cart-count">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="max-w-5xl mx-auto flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            data-testid={`store-cat-${c.id}`}
            className="px-3 py-1.5 rounded-md font-mono text-[11px] tracking-widest transition-all"
            style={{
              background: category === c.id ? 'rgba(0,240,255,0.12)' : 'transparent',
              border: `1px solid ${category === c.id ? '#00F0FF' : 'rgba(255,255,255,0.1)'}`,
              color: category === c.id ? '#00F0FF' : 'rgba(255,255,255,0.5)',
            }}
          >
            {c.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="max-w-5xl mx-auto text-center py-16 font-mono text-xs text-foreground/40 tracking-widest">
          CARREGANDO PRODUTOS...
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" data-testid="store-grid">
          {filtered.map((p, i) => {
            const priceN = p.priceByChain?.[chainKey] || 0;
            const canBuy = priceN > 0;
            return (
              <motion.div
                key={p.id}
                initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.3,delay:i*0.05}}
                className="glass rounded-xl border p-5 flex flex-col"
                style={{ borderColor: 'rgba(102,126,234,0.25)' }}
                data-testid={`store-product-${p.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{p.emoji || '\u{1F4E6}'}</div>
                  {p.badge && (
                    <span className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest"
                      style={{background:'rgba(204,255,0,0.12)', border:'1px solid rgba(204,255,0,0.4)', color:'#CCFF00'}}>
                      {p.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg text-foreground mb-1">{p.name}</h3>
                <p className="text-xs text-foreground/60 leading-relaxed mb-4 flex-1">{p.description}</p>
                <div className="mb-3">
                  <p className="font-mono text-[10px] tracking-widest text-foreground/40">PREÇO</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-lg" style={{color: activeChain.accent}}>
                      {priceN > 0 ? priceN : '—'} <span className="text-[11px] tracking-widest">{activeChain.symbol}</span>
                    </span>
                    <span className="text-xs text-foreground/40 font-mono">≈ US${p.priceUSD?.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => addToCart(p)}
                  disabled={!canBuy}
                  data-testid={`store-add-${p.id}`}
                  className="w-full py-2 rounded-md font-mono text-[11px] tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: canBuy ? 'rgba(0,240,255,0.1)' : 'transparent',
                    border: `1px solid ${canBuy ? '#00F0FF' : 'rgba(255,255,255,0.1)'}`,
                    color: canBuy ? '#00F0FF' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {canBuy ? 'ADICIONAR' : 'INDISPONÍVEL NESTA REDE'}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
          >
            <motion.div
              initial={{y:50,opacity:0}} animate={{y:0,opacity:1}} exit={{y:50,opacity:0}}
              onClick={e => e.stopPropagation()}
              className="glass rounded-2xl border border-cyanElectric/30 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative"
              data-testid="store-cart-modal"
            >
              <button
                onClick={() => setCartOpen(false)}
                data-testid="store-cart-close"
                className="absolute top-4 right-4 text-foreground/50 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              {checkoutStatus === 'success' && lastTx ? (
                <div className="text-center py-4">
                  <Check className="w-14 h-14 text-acidGreen mx-auto mb-4" />
                  <h3 className="font-display text-2xl text-acidGreen mb-2">Pagamento confirmado!</h3>
                  <p className="font-mono text-xs text-foreground/60 mb-4">
                    Transação registrada. Nossa equipe recebeu a confirmação por e-mail.
                  </p>
                  <a
                    href={lastTx.explorerLink}
                    target="_blank" rel="noopener noreferrer"
                    data-testid="store-tx-explorer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs tracking-widest text-cyanElectric border border-cyanElectric/50 hover:bg-cyanElectric/10 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> VER NO EXPLORER
                  </a>
                  <p className="mt-4 font-mono text-[10px] text-foreground/40 break-all">{lastTx.hash}</p>
                  <button
                    onClick={() => { setCheckoutStatus('idle'); setLastTx(null); setCartOpen(false); }}
                    className="mt-6 px-4 py-2 rounded-md font-mono text-xs tracking-widest text-foreground/60 border border-white/10 hover:border-white/30"
                  >
                    FECHAR
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-xl text-foreground mb-1">Carrinho</h2>
                  <p className="font-mono text-[10px] tracking-widest text-foreground/40 mb-4">
                    {activeChain.emoji} {activeChain.label} · {activeChain.mode === 'testnet' ? (activeChain.label || 'TESTNET') : 'MAINNET'}
                  </p>

                  {cart.length === 0 ? (
                    <p className="py-8 text-center font-mono text-xs text-foreground/40 italic">
                      Carrinho vazio.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        {cart.map(item => {
                          const p = products.find(x => x.id === item.id);
                          if (!p) return null;
                          const pn = p.priceByChain?.[chainKey] || 0;
                          const line = pn * (item.quantity || 1);
                          return (
                            <div key={item.id} className="flex items-center gap-3 p-2 rounded-md bg-white/[0.03]">
                              <span className="text-2xl">{p.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm truncate">{p.name}</p>
                                <p className="font-mono text-[10px] text-foreground/50">
                                  {pn} {activeChain.symbol} · ≈ US${p.priceUSD?.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => changeQty(item.id, -1)} data-testid={`store-qty-minus-${item.id}`} className="w-6 h-6 rounded border border-white/10 flex items-center justify-center hover:border-white/30">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="min-w-[24px] text-center font-mono text-xs">{item.quantity}</span>
                                <button onClick={() => changeQty(item.id, 1)} data-testid={`store-qty-plus-${item.id}`} className="w-6 h-6 rounded border border-white/10 flex items-center justify-center hover:border-white/30">
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button onClick={() => removeFromCart(item.id)} data-testid={`store-remove-${item.id}`} className="w-6 h-6 ml-1 rounded border border-magenta/30 text-magenta flex items-center justify-center hover:bg-magenta/10">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="font-mono text-xs text-cyanElectric ml-2 hidden sm:block min-w-[80px] text-right">
                                {line.toFixed(6)} {activeChain.symbol}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t border-white/10 pt-4 mb-4 space-y-1 font-mono text-sm">
                        <div className="flex justify-between text-foreground/70">
                          <span>Subtotal</span>
                          <span>{totalNative.toFixed(6)} {activeChain.symbol}</span>
                        </div>
                        <div className="flex justify-between text-foreground/50 text-xs">
                          <span>≈ USD</span>
                          <span>US$ {totalUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-cyanElectric text-lg pt-2 font-display">
                          <span>Total</span>
                          <span>{totalNative.toFixed(6)} {activeChain.symbol}</span>
                        </div>
                      </div>

                      <input
                        type="email"
                        value={buyerEmail}
                        onChange={e => setBuyerEmail(e.target.value)}
                        placeholder="Seu e-mail (opcional — receberá o comprovante)"
                        data-testid="store-buyer-email"
                        className="w-full mb-3 bg-white/5 border border-white/10 rounded-md px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-cyanElectric transition-colors"
                      />

                      {checkoutErr && (
                        <p className="mb-3 font-mono text-[11px] text-magenta/80">{checkoutErr}</p>
                      )}

                      <button
                        onClick={submitCheckout}
                        disabled={!account || checkoutStatus === 'signing' || checkoutStatus === 'confirming' || totalNative <= 0}
                        data-testid="store-checkout-btn"
                        className="w-full py-3 rounded-md font-mono text-xs tracking-widest transition-all inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: 'rgba(204,255,0,0.15)',
                          border: '1px solid #CCFF00',
                          color: '#CCFF00',
                          boxShadow: '0 0 14px rgba(204,255,0,0.25)',
                        }}
                      >
                        {['signing','confirming'].includes(checkoutStatus) ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />
                            {checkoutStatus === 'signing' ? 'ASSINE NA WALLET...' : 'CONFIRMANDO...'}
                          </>
                        ) : !account ? (
                          <><Wallet className="w-4 h-4" /> CONECTE UMA WALLET PRIMEIRO</>
                        ) : (
                          <><StoreIcon className="w-4 h-4" /> PAGAR {totalNative.toFixed(6)} {activeChain.symbol}</>
                        )}
                      </button>

                      <p className="mt-3 text-center font-mono text-[9px] tracking-widest text-foreground/40">
                        TESTNET · SEM DINHEIRO REAL · TAXAS DE GÁS DA REDE PODEM SE APLICAR
                      </p>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameContainer>
  );
}
