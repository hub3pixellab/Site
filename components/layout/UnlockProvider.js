'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const UnlockCtx = createContext(null);

export function UnlockProvider({ children }) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('hub3.unlocked') === '1') setUnlocked(true);
    } catch (e) {}
  }, []);

  const unlock = useCallback(() => {
    setUnlocked(true);
    try { sessionStorage.setItem('hub3.unlocked', '1'); } catch (e) {}
  }, []);

  const reset = useCallback(() => {
    setUnlocked(false);
    try { sessionStorage.removeItem('hub3.unlocked'); } catch (e) {}
  }, []);

  return (
    <UnlockCtx.Provider value={{ unlocked, unlock, reset }}>
      {children}
    </UnlockCtx.Provider>
  );
}

export function useUnlock() {
  const ctx = useContext(UnlockCtx);
  if (!ctx) throw new Error('useUnlock must be used within UnlockProvider');
  return ctx;
}
