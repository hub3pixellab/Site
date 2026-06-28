// One-time seeder: empurra o conteúdo estático de lib/content.js para o Sanity.
// Roda com: node /app/scripts/seed-sanity.mjs
// Após rodar, você pode editar tudo direto no Studio em /studio.

import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const projectId  = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset    = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';
const token      = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('❌ Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_WRITE_TOKEN in .env');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

// --- Matchmaker questions ---
const matchmaker = [
  { sortOrder: 1, yesVector: 'HouseLab', noVector: 'PixelLab', cardText: 'Clínica médica sem captura de leads online.' },
  { sortOrder: 2, yesVector: 'HouseLab', noVector: 'AppLab',   cardText: 'Portal com tráfego massivo derrubando servidores.' },
  { sortOrder: 3, yesVector: 'PixelLab', noVector: 'HouseLab', cardText: 'Programa de fidelidade morto na primeira semana.' },
  { sortOrder: 4, yesVector: 'PixelLab', noVector: 'AppLab',   cardText: 'Indicações manuais sem rastreabilidade.' },
  { sortOrder: 5, yesVector: 'AppLab',   noVector: 'HouseLab', cardText: 'Restaurante perdendo pedidos sem ERP unificado.' },
  { sortOrder: 6, yesVector: 'AppLab',   noVector: 'PixelLab', cardText: 'Obras sem marketplace geolocalizado de materiais.' },
];

// --- Portfolio projects ---
const projects = [
  {
    title: 'Lu Alves Fonoaudióloga',
    division: 'House Lab',
    description: 'Site institucional médico com captura de leads qualificada. Funil de agendamento, SEO local e hosting edge.',
    marketVertical: 'Saúde / Lead Capture',
    liveUrl: 'https://lualvesfonoaudiologa.com',
    tags: ['SEO', 'Lead Capture', 'Edge Hosting'],
    metrics: [{ k: 'CVR', v: '6.8%' }, { k: 'CAC', v: '-42%' }, { k: 'Time to ship', v: '14d' }],
  },
  {
    title: 'Portal Lux.sex',
    division: 'House Lab',
    description: 'Arquitetura de backend para tráfego massivo com selo "Criado por HUB3Lab". Cache distribuído e observabilidade enterprise.',
    marketVertical: 'AdultTech / High-Traffic',
    liveUrl: 'https://lux.sex',
    tags: ['Edge Hosting', 'Cache Layer', 'Observabilidade'],
    metrics: [{ k: 'RPS pico', v: '12k' }, { k: 'Uptime', v: '99.99%' }, { k: 'P95', v: '180ms' }],
  },
  {
    title: 'Oh!Bra',
    division: 'AppLab',
    description: 'iFood da construção: marketplace geolocalizado de materiais, locação de equipamentos, serviços técnicos e calculadora IA de obra.',
    marketVertical: 'Proptech / Construction',
    blockChainTech: false,
    tags: ['Geolocalização', 'AI Core', 'Split Pay'],
    metrics: [{ k: 'GMV', v: 'R$ 4.2M' }, { k: 'SKUs', v: '8.7k' }, { k: 'Cidades', v: '38' }],
  },
  {
    title: 'B2B White Label Restaurant',
    division: 'AppLab',
    description: 'Ecossistema ERP+CRM para restaurantes com dashboard de franquias multi-tier e operações em escala.',
    marketVertical: 'FoodTech / B2B',
    tags: ['Multi-tenant', 'ERP', 'White Label'],
    metrics: [{ k: 'Franquias', v: '+27' }, { k: 'Tickets', v: '-31%' }, { k: 'Margin lift', v: '+9pp' }],
  },
  {
    title: 'TokenPrivé / Club3 Token',
    division: 'AppLab',
    description: 'App para clubs swinger/adultos com streaming criptografado em grupo, IA anti-leak (bloqueador de screenshots), tokenomics circulares com bônus de referência, login diário e cashback de sexshop.',
    marketVertical: 'AdultTech / SaaS',
    blockChainTech: true,
    smartContractsUsed: true,
    tags: ['Criptografia', 'AI Anti-leak', 'Tokenomics', 'Referências'],
    metrics: [{ k: 'Tokens em loop', v: '92%' }, { k: 'D7 retention', v: '54%' }, { k: 'Referências', v: '3.4x' }],
  },
  {
    title: 'Delivery Automation',
    division: 'AppLab',
    description: 'Concorrente Anota AI com IA conversacional avançada, integração WhatsApp/IG/SMS e split de pagamento.',
    marketVertical: 'FoodTech / Conversational AI',
    tags: ['AI Core', 'Conversational', 'Split Pay'],
    metrics: [{ k: 'Conversão', v: '+38%' }, { k: 'TMA', v: '-61%' }, { k: 'Canais', v: 'WA · IG · SMS' }],
  },
];

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function run() {
  console.log('\n🌱 Seeding Sanity (project:', projectId, '/', dataset, ')...\n');
  const tx = client.transaction();

  for (const q of matchmaker) {
    const slug = slugify(q.cardText).slice(0, 80);
    tx.createOrReplace({
      _id: `matchmaker-${slug}`,
      _type: 'matchmaker',
      questionId: { _type: 'slug', current: slug },
      cardText: q.cardText,
      yesVector: q.yesVector,
      noVector: q.noVector,
      sortOrder: q.sortOrder,
    });
  }

  for (const p of projects) {
    const slug = slugify(p.title);
    tx.createOrReplace({
      _id: `project-${slug}`,
      _type: 'project',
      title: p.title,
      division: p.division,
      caseSlug: { _type: 'slug', current: slug },
      description: p.description,
      marketVertical: p.marketVertical || '',
      blockChainTech: !!p.blockChainTech,
      smartContractsUsed: !!p.smartContractsUsed,
      liveUrl: p.liveUrl || undefined,
      tags: p.tags || [],
      metrics: (p.metrics || []).map((m) => ({ _key: uuidv4().slice(0, 12), k: m.k, v: m.v })),
    });
  }

  const result = await tx.commit();
  console.log(`✅ Seeded ${matchmaker.length} matchmaker questions + ${projects.length} portfolio projects.`);
  console.log(`   Transaction id: ${result.transactionId}`);
}

run().catch((e) => {
  console.error('❌ Seed failed:', e?.message || e);
  process.exit(1);
});
