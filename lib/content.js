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

// ============================================================
// EQUIPE — Membros HUB3 Lab
// ============================================================
export const team = [
  {
    id: 'diogo-zachi',
    name: 'Diogo Zachi',
    initials: 'DZ',
    accent: '#22E0F5',
    icon: 'crown',
    roleTag: 'FOUNDER',
    avatar: null, // adicione /public/team/diogo.jpg quando tiver foto
    title: {
      pt: 'Founder & Mastermind de Ecossistemas Digitais',
      en: 'Founder & Mastermind of Digital Ecosystems',
    },
    quote: {
      pt: 'Pioneiro tech, artista multimídia e o cara que escreveu o manual da Liderança Regenerativa.',
      en: 'Tech pioneer, multimedia artist and the guy who wrote the manual on Regenerative Leadership.',
    },
    bio: {
      pt: [
        'Com um DNA que mistura Administração com ênfase em T.I. e Gestão Pública, pós-graduação em Gestão de Pessoas e um MBA em Hotelaria e Eventos, Diogo não apenas prevê o futuro dos negócios — ele o projeta. Autor do livro REGEN: Liderança Regenerativa, ele lidera a holding aplicando conceitos que transformam culturas corporativas e criam ecossistemas sustentáveis e de alta tração.',
        'Ele desmonta, monta e otimiza um PC de olhos fechados tão bem quanto estrutura uma rede de dados à prova de falhas.',
        'Mas nem só de código vive o homem. Há mais de uma década, Diogo joga no time da criatividade como artista, produtor musical e designer, integrando o estúdio Unidade. Para fechar o pacote de experiências camaleônicas, ele já comandou frentes comerciais na indústria farmacêutica, gerenciou academias e liderou o atendimento de alto padrão na hotelaria de luxo (Cyan Resort).',
        'Na HUB3 Lab, ele junta esse caldeirão de pioneirismo tech, sensibilidade artística e psicologia de liderança para transformar ideias brutas em plataformas Web3 ultra-engajantes, viciantes e lucrativas.',
      ],
      en: [
        'With a DNA mixing Business Admin (IT focus), Public Management, a post-grad in People Management and an MBA in Hospitality & Events, Diogo doesn’t just forecast the future of business — he engineers it. Author of REGEN: Regenerative Leadership, he leads the holding applying concepts that transform corporate cultures and build sustainable, high-traction ecosystems.',
        'He disassembles, assembles and tunes a PC blindfolded just as well as he architects a failure-proof data network.',
        'But code isn’t the whole story. For over a decade, Diogo has played on the creative team as artist, music producer and designer, part of Unidade studio. To round off his chameleon-like experience, he has led commercial fronts in pharma, managed gyms and headed high-end guest experience in luxury hospitality (Cyan Resort).',
        'At HUB3 Lab, he blends this cauldron of tech pioneering, artistic sensitivity and leadership psychology to turn raw ideas into ultra-engaging, addictive and profitable Web3 platforms.',
      ],
    },
    tags: [
      { icon: 'building', label: { pt: 'Autor · REGEN', en: 'Author · REGEN' } },
      { icon: 'sparkles', label: { pt: 'Liderança Regenerativa', en: 'Regenerative Leadership' } },
      { icon: 'target', label: { pt: 'Smart Contracts', en: 'Smart Contracts' } },
      { icon: 'briefcase', label: { pt: 'Tokenomics', en: 'Tokenomics' } },
      { icon: 'graduation', label: { pt: 'MBA Hospitalidade', en: 'Hospitality MBA' } },
      { icon: 'music', label: { pt: 'Produtor Musical', en: 'Music Producer' } },
    ],
  },
  {
    id: 'bruno-xavier',
    name: 'Bruno Xavier',
    initials: 'BX',
    accent: '#FF9416',
    icon: 'rocket',
    roleTag: 'CO-FOUNDER',
    avatar: null,
    title: {
      pt: 'Co-founder & Head de Engenharia de Produtos',
      en: 'Co-founder & Head of Product Engineering',
    },
    quote: {
      pt: 'Aos 23 anos, ele audita finanças de dia, calibra o swing no golfe à tarde e bota código de alta escala para rodar à noite.',
      en: 'At 23, he audits finances by day, calibrates his golf swing in the afternoon and ships high-scale code at night.',
    },
    bio: {
      pt: [
        'Bruno Xavier é a definição da nova geração tech: hiperfocado, dinâmico e o braço direito na HUB3. Especialista em Computação Gráfica e Produtos Digitais, ele lidera o desenvolvimento de software absorvendo inteligência de mercado pura e transformando visões disruptivas em aplicativos reais.',
        'O diferencial do Bruno é a precisão cirúrgica de quem joga em várias posições e vence em todas. Ele atua diretamente na Auditoria Financeira, o que significa que olha para linhas de código com a mesma mente analítica com que audita a saúde econômica de grandes operações. Essa exatidão financeira é o que garante que os contratos inteligentes e a economia de tokens da HUB3 sejam matematicamente perfeitos.',
        'Empreendedor desde cedo, Bruno domina a fusão entre hardware e software através de anos de experiência prática e assistência técnica. Quando quer desligar as telas e recalibrar o foco mental, vai para o campo praticar golfe — esporte onde aprendeu que cada milímetro de cálculo faz a diferença entre o erro e o topo do placar.',
        'Na HUB3 Lab, ele comanda a fábrica de códigos, convertendo a estratégia da holding em plataformas SaaS de alta performance e arquiteturas digitais prontas para dar um checkout de sucesso no mercado B2B.',
      ],
      en: [
        'Bruno Xavier is the definition of the new tech generation: hyper-focused, dynamic and the right hand at HUB3. Specialist in Computer Graphics and Digital Products, he leads software development, absorbing pure market intelligence and turning disruptive visions into real apps.',
        'Bruno’s edge is the surgical precision of someone who plays multiple positions — and wins in all of them. He works directly in Financial Auditing, meaning he looks at lines of code with the same analytical mindset he uses to audit the financial health of large operations. That financial precision is what guarantees HUB3’s smart contracts and token economies are mathematically perfect.',
        'An entrepreneur from an early age, Bruno masters the fusion of hardware and software through years of hands-on tech-support experience. When he needs to unplug and reset his focus, he heads to the golf course — a sport where he learned that every millimeter of calculation is the difference between a miss and the top of the scoreboard.',
        'At HUB3 Lab, he runs the code factory, converting the holding’s strategy into high-performance SaaS platforms and digital architectures ready to checkout success in the B2B market.',
      ],
    },
    tags: [
      { icon: 'code', label: { pt: 'Computação Gráfica', en: 'Computer Graphics' } },
      { icon: 'sparkles', label: { pt: 'Artes Gráficas', en: 'Graphic Design' } },
      { icon: 'calculator', label: { pt: 'Controle de Planilhas', en: 'Spreadsheet Mastery' } },
      { icon: 'briefcase', label: { pt: 'Relatórios Inteligentes', en: 'Smart Reporting' } },
      { icon: 'target', label: { pt: 'Auditoria Financeira', en: 'Financial Auditing' } },
    ],
  },
];

export const allTags = [
  'SEO', 'Lead Capture', 'Edge Hosting', 'Cache Layer', 'Observabilidade',
  'Geolocalização', 'AI Core', 'Split Pay', 'Multi-tenant', 'ERP',
  'White Label', 'Criptografia', 'AI Anti-leak', 'Tokenomics', 'Referências',
  'Conversational',
];
