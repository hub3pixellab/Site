import { createClient } from '@sanity/client';

/**
 * @typedef {Object} SanityEnv
 * @property {string} projectId
 * @property {string} dataset
 * @property {string} apiVersion
 * @property {string|undefined} token
 */

/** @type {SanityEnv} */
const env = {
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET    || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token:      process.env.SANITY_WRITE_TOKEN,
};

/**
 * É considerada configurada quando o projectId está presente E não é dummy/placeholder.
 * Demais módulos usam este flag para retornar fallbacks graciosos
 * enquanto o usuário ainda não conectou o projeto Sanity.
 */
export const isSanityConfigured = Boolean(
  env.projectId && !['dummy', 'placeholder-id', 'placeholder'].includes(env.projectId)
);

/**
 * Cliente de leitura. Usamos useCdn:false para garantir consist\u00eancia
 * imediata p\u00f3s-mutations (importante p/ leaderboard live e upsert por nickname).
 * O cache de borda \u00e9 feito no n\u00edvel das route handlers via `revalidate`.
 */
export const sanityReadClient = isSanityConfigured
  ? createClient({
      projectId: env.projectId,
      dataset: env.dataset,
      apiVersion: env.apiVersion,
      useCdn: false,
      perspective: 'published',
    })
  : null;

/**
 * Cliente de escrita (sem CDN; usa token secreto; apenas server-side).
 */
export const sanityWriteClient =
  isSanityConfigured && env.token
    ? createClient({
        projectId: env.projectId,
        dataset: env.dataset,
        apiVersion: env.apiVersion,
        useCdn: false,
        token: env.token,
        perspective: 'published',
      })
    : null;

export const sanityEnv = env;
