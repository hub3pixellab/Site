'use client';
import useSWR from 'swr';

const fetcher = async (url) => {
  const r = await fetch(url);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `Request failed: ${r.status}`);
  return d;
};

/**
 * useMatchmakerQuestions
 * Stream das questions do matchmaker (sortOrder asc).
 * Em quanto Sanity não estiver configurado, retorna array vazio + configured=false.
 */
export function useMatchmakerQuestions() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/matchmaker/questions',
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  );

  return {
    questions: data?.questions || [],
    configured: Boolean(data?.configured),
    loading: isLoading,
    error,
    refetch: mutate,
  };
}
