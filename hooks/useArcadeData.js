'use client';
import { useCallback, useState } from 'react';
import useSWR from 'swr';

/**
 * @typedef {Object} LeadPayload
 * @property {string} nickname
 * @property {string} email
 * @property {string} phone
 * @property {number} score
 */

const fetcher = async (url) => {
  const r = await fetch(url);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `Request failed: ${r.status}`);
  return d;
};

/**
 * Hook principal do arcade.
 * - submitLead(payload): persiste/atualiza lead via /api/arcade/lead
 * - leaderboard: top 10 via /api/arcade/leaderboard (SWR + revalidate)
 */
export function useArcadeData(game = null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  const url = game
    ? `/api/arcade/leaderboard?game=${encodeURIComponent(game)}`
    : '/api/arcade/leaderboard';

  const {
    data: lbData,
    error: lbError,
    isLoading: lbLoading,
    mutate: refreshLeaderboard,
  } = useSWR(url, fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
  });

  /** @param {LeadPayload} payload */
  const submitLead = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/arcade/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to submit lead');
      }
      setLastResponse(data);
      // Refresca leaderboard após persistir
      refreshLeaderboard();
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshLeaderboard]);

  return {
    submitLead,
    loading,
    error,
    lastResponse,
    leaderboard: lbData?.leaderboard || [],
    leaderboardLoading: lbLoading,
    leaderboardError: lbError,
    refreshLeaderboard,
    configured: Boolean(lbData?.configured),
  };
}
