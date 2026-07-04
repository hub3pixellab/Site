'use client';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemas';

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder-id';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';

export default defineConfig({
  basePath: '/studio',
  name: 'hub3-lab-cms',
  title: 'HUB3 Lab CMS',
  projectId,
  dataset,
  apiVersion,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('HUB3 Lab')
          .items([
            S.listItem()
              .title('🎮 Arcade Leads')
              .child(
                S.documentTypeList('lead')
                  .title('Arcade Leads')
                  .defaultOrdering([{ field: 'score', direction: 'desc' }])
              ),
            S.listItem()
              .title('❤️ Matchmaker Questions')
              .child(
                S.documentTypeList('matchmaker')
                  .title('Matchmaker Questions')
                  .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }])
              ),
            S.listItem()
              .title('🚀 Portfolio Projects')
              .child(S.documentTypeList('project').title('Portfolio Projects')),
            S.listItem()
              .title('📄 Whitepaper')
              .child(
                S.documentTypeList('whitepaper')
                  .title('Whitepaper Documents')
                  .defaultOrdering([{ field: 'updatedAt', direction: 'desc' }])
              ),
            S.listItem()
              .title('🛍️ Produtos (Store)')
              .child(
                S.documentTypeList('product')
                  .title('Store Products')
                  .defaultOrdering([{ field: 'order', direction: 'asc' }])
              ),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: { types: schemaTypes },
});
