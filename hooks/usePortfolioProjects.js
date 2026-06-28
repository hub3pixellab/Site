'use client';
import useSWR from 'swr';

const fetcher = async (url) => {
  const r = await fetch(url);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `Request failed: ${r.status}`);
  return d;
};

export function usePortfolioProjects() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/portfolio/projects',
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    projects: data?.projects || [],
    configured: Boolean(data?.configured),
    loading: isLoading,
    error,
    refetch: mutate,
  };
}
