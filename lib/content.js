// HUB3 Lab content (estrutura espelhando o futuro schema Sanity)
// Quando integrar Sanity, basta substituir esses arrays por fetch via @sanity/client.

export const divisions = [
  {
    id: 'house-lab',
    name: 'House Lab',
    color: 'acidGreen',
    short: 'Web Presence & B2B Infrastructure',
    description: {
      pt: 'Presença digital institucional, sites de alta conversão e infraestrutura B2B para negócios que precisam de autoridade.',
      en: 'Institutional digital presence, high-converting websites and B2B infrastructure for businesses that need authority.',
    },
    skills: ['Next.js', 'SEO', 'Lead Capture', 'Edge Hosting', 'A/B Testing'],
  },
  {
    id: 'pixel-lab',
    name: 'PixelLab',
    color: 'cyanElectric',
    short: 'Gamification & Token Economics',
    description: {
      pt: 'Mecânicas de jogo, economia de tokens e fidelização circular para produtos digitais que querem retê máxima.',
      en: 'Game mechanics, token economics and circular loyalty for digital products aiming at maximum retention.',
    },
    skills: ['Tokenomics', 'Gamified UX', 'Loyalty Loops', 'Smart Contracts', 'Referral Engines'],
  },
  {
    id: 'app-lab',
    name: 'AppLab',
    color: 'magentaSunset',
    short: 'Scalable Mobile/Web Applications',
    description: {
      pt: 'Aplicativos mobile e web escaláveis com backend tolerante a tráfego intenso e infraestrutura modular.',
      en: 'Scalable mobile/web apps with traffic-tolerant backends and modular infrastructure.',
    },
    skills: ['React Native', 'NestJS', 'Multi-tenant', 'Realtime', 'AI Core'],
  },
];

export const matchmakerCards = [
  {
    id: 'm1',
    division: 'house-lab',
    pain: { pt: 'Clínica médica sem captura de leads online.', en: 'Medical clinic with no online lead capture.' },
    solution: { pt: 'Site institucional + funil de agendamento.', en: 'Institutional site + booking funnel.' },
  },
  {
    id: 'm2',
    division: 'house-lab',
    pain: { pt: 'Portal com tráfego massivo derrubando servidores.', en: 'High-traffic portal crashing servers.' },
    solution: { pt: 'Backend distribuído e arquitetura edge.', en: 'Distributed backend & edge architecture.' },
  },
  {
    id: 'm3',
    division: 'pixel-lab',
    pain: { pt: 'Programa de fidelidade morto na primeira semana.', en: 'Loyalty program dead after week 1.' },
    solution: { pt: 'Tokens, login diário e cashback de sexshop.', en: 'Tokens, daily login and sexshop cashback.' },
  },
  {
    id: 'm4',
    division: 'pixel-lab',
    pain: { pt: 'Indicações manuais sem rastreabilidade.', en: 'Manual referrals with no tracking.' },
    solution: { pt: 'Engine de referência com bônus circulares.', en: 'Referral engine with circular bonuses.' },
  },
  {
    id: 'm5',
    division: 'app-lab',
    pain: { pt: 'Restaurante perdendo pedidos sem ERP unificado.', en: 'Restaurant losing orders without unified ERP.' },
    solution: { pt: 'ERP+CRM com dashboard de franquias multi-tier.', en: 'ERP+CRM with multi-tier franchise dashboard.' },
  },
  {
    id: 'm6',
    division: 'app-lab',
    pain: { pt: 'Obras sem marketplace geolocalizado.', en: 'Construction with no geo marketplace.' },
    solution: { pt: 'Oh!Bra: iFood da construção + calculadora IA.', en: 'Oh!Bra: construction iFood + AI calculator.' },
  },
];

export const cases = [
  {
    id: 'lualves',
    division: 'house-lab',
    name: 'Lu Alves Fonoaudióloga',
    url: 'https://lualvesfonoaudiologa.com',
    summary: { pt: 'Site institucional médico com captura de leads qualificada.', en: 'Medical institutional site with qualified lead capture.' },
    metrics: [
      { k: 'CVR', v: '6.8%' },
      { k: 'CAC', v: '-42%' },
      { k: 'Time to ship', v: '14d' },
    ],
    tags: ['SEO', 'Lead Capture', 'Edge Hosting'],
  },
  {
    id: 'lux',
    division: 'house-lab',
    name: 'Portal Lux.sex',
    url: 'https://lux.sex',
    summary: { pt: 'Arquitetura de backend para tráfego massivo com selo “Criado por HUB3Lab”.', en: 'Massive-traffic backend architecture with “Built by HUB3Lab” signature.' },
    metrics: [
      { k: 'RPS pico', v: '12k' },
      { k: 'Uptime', v: '99.99%' },
      { k: 'P95', v: '180ms' },
    ],
    tags: ['Edge Hosting', 'Cache Layer', 'Observabilidade'],
  },
  {
    id: 'ohbra',
    division: 'app-lab',
    name: 'Oh!Bra',
    url: '#',
    summary: { pt: 'iFood da construção: marketplace geolocalizado + calculadora IA.', en: 'Construction iFood: geo-marketplace + AI calculator.' },
    metrics: [
      { k: 'GMV', v: 'R$ 4.2M' },
      { k: 'SKUs', v: '8.7k' },
      { k: 'Cidades', v: '38' },
    ],
    tags: ['Geolocalização', 'AI Core', 'Split Pay'],
  },
  {
    id: 'b2b-restaurant',
    division: 'app-lab',
    name: 'B2B White Label Restaurant',
    url: '#',
    summary: { pt: 'ERP+CRM com dashboard de franquias multi-tier.', en: 'ERP+CRM with multi-tier franchise dashboard.' },
    metrics: [
      { k: 'Franquias', v: '+27' },
      { k: 'Tickets', v: '-31%' },
      { k: 'Margin lift', v: '+9pp' },
    ],
    tags: ['Multi-tenant', 'ERP', 'White Label'],
  },
  {
    id: 'tokenprive',
    division: 'app-lab',
    name: 'TokenPrivé / Club3 Token',
    url: '#',
    summary: { pt: 'App adulto com streaming criptografado, IA anti-leak e tokens circulares.', en: 'Adult app with encrypted streaming, anti-leak AI and circular tokens.' },
    metrics: [
      { k: 'Tokens em loop', v: '92%' },
      { k: 'D7 retention', v: '54%' },
      { k: 'Referências', v: '3.4x' },
    ],
    tags: ['Criptografia', 'AI Anti-leak', 'Tokenomics', 'Referências'],
  },
  {
    id: 'delivery',
    division: 'app-lab',
    name: 'Delivery Automation',
    url: '#',
    summary: { pt: 'Concorrente Anota AI com IA conversacional avançada.', en: 'Anota AI competitor powered by advanced conversational AI.' },
    metrics: [
      { k: 'Conversão', v: '+38%' },
      { k: 'TMA', v: '-61%' },
      { k: 'Canais', v: 'WA · IG · SMS' },
    ],
    tags: ['AI Core', 'Conversational', 'Split Pay'],
  },
];

export const allTags = [
  'SEO', 'Lead Capture', 'Edge Hosting', 'Cache Layer', 'Observabilidade',
  'Geolocalização', 'AI Core', 'Split Pay', 'Multi-tenant', 'ERP',
  'White Label', 'Criptografia', 'AI Anti-leak', 'Tokenomics', 'Referências',
  'Conversational',
];
