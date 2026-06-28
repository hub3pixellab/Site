'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { dict } from '@/lib/i18n-dict';

const I18nCtx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('pt');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hub3.lang');
      if (saved === 'pt' || saved === 'en') setLang(saved);
    } catch (e) {}
  }, []);

  const change = useCallback((next) => {
    setLang(next);
    try { localStorage.setItem('hub3.lang', next); } catch (e) {}
  }, []);

  const t = useCallback((key) => {
    const parts = key.split('.');
    let node = dict[lang];
    for (const p of parts) {
      if (node && typeof node === 'object' && p in node) node = node[p];
      else return key;
    }
    return node;
  }, [lang]);

  return (
    <I18nCtx.Provider value={{ lang, setLang: change, t }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
