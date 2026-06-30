'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'hub3_registration_v1';

const RegistrationContext = createContext({
  isRegistered: false,
  registration: null,
  registerLead: async () => {},
  clearRegistration: () => {},
});

/**
 * Provedor global de cadastro/lead. Persistido em localStorage.
 * - isRegistered: true se o usuário já submeteu o cadastro (lead obrigatório)
 * - registration: { nickname, email, phone, registeredAt, lastScore? }
 * - registerLead(payload): POST /api/arcade/lead + persiste localmente
 */
export function RegistrationProvider({ children }) {
  const [registration, setRegistration] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRegistration(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  const persist = useCallback((value) => {
    setRegistration(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else       localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const registerLead = useCallback(async (payload) => {
    const body = {
      nickname: (payload?.nickname || '').trim(),
      email:    (payload?.email || '').trim(),
      phone:    (payload?.phone || '').trim(),
      score:    Number(payload?.score) || 0,
      game:     payload?.game || 'hub3-arcade',
    };

    const res = await fetch('/api/arcade/lead', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      throw new Error(data?.error || 'Falha ao cadastrar');
    }

    persist({
      nickname:      body.nickname,
      email:         body.email,
      phone:         body.phone,
      registeredAt:  new Date().toISOString(),
      lastScore:     body.score,
      configured:    Boolean(data?.configured),
    });
    return data;
  }, [persist]);

  const clearRegistration = useCallback(() => persist(null), [persist]);

  return (
    <RegistrationContext.Provider
      value={{
        isRegistered: Boolean(registration && registration.nickname),
        registration,
        registerLead,
        clearRegistration,
        hydrated,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  return useContext(RegistrationContext);
}
