/**
 * Product schema — HUB3 Store Web3.
 * Suporta preços por blockchain e endereço de recebimento por rede.
 */
export default {
  name: 'product',
  title: 'Produto (Store)',
  type: 'document',
  fields: [
    { name: 'name', title: 'Nome', type: 'string', validation: R => R.required().min(2).max(80) },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name', maxLength: 96 } },
    {
      name: 'category',
      title: 'Categoria',
      type: 'string',
      options: {
        list: [
          { title: 'Software', value: 'software' },
          { title: 'Hardware', value: 'hardware' },
          { title: 'NFT', value: 'nft' },
          { title: 'Serviços', value: 'services' },
        ],
        layout: 'radio',
      },
      validation: R => R.required(),
    },
    { name: 'emoji', title: 'Emoji', type: 'string', description: 'Emoji representativo, ex: 🎨' },
    { name: 'description', title: 'Descrição curta', type: 'text', rows: 2 },
    { name: 'details', title: 'Detalhes (opcional)', type: 'text', rows: 5 },
    { name: 'badge', title: 'Badge', type: 'string', description: 'Ex: NEW, HOT, LIMITED' },
    { name: 'priceUSD', title: 'Preço base (USD)', type: 'number', validation: R => R.required().min(0) },
    {
      name: 'priceByChain',
      title: 'Preços por Blockchain',
      type: 'object',
      description: 'Valor em unidade nativa (ETH/BNB/MATIC/SOL/etc). Deixe 0 para não aceitar naquela rede.',
      fields: [
        { name: 'ethereum', title: 'Ethereum (ETH)', type: 'number', initialValue: 0 },
        { name: 'bnb',      title: 'BNB Chain (BNB)', type: 'number', initialValue: 0 },
        { name: 'polygon',  title: 'Polygon (MATIC)', type: 'number', initialValue: 0 },
        { name: 'arbitrum', title: 'Arbitrum (ETH)', type: 'number', initialValue: 0 },
        { name: 'optimism', title: 'Optimism (ETH)', type: 'number', initialValue: 0 },
        { name: 'linea',    title: 'Linea (ETH)', type: 'number', initialValue: 0 },
        { name: 'solana',   title: 'Solana (SOL)', type: 'number', initialValue: 0 },
      ],
    },
    { name: 'image', title: 'Imagem (opcional)', type: 'image', options: { hotspot: true } },
    { name: 'stock', title: 'Estoque', type: 'number', initialValue: 999, description: '-1 = ilimitado' },
    { name: 'published', title: 'Publicado', type: 'boolean', initialValue: true },
    { name: 'order', title: 'Ordem', type: 'number', initialValue: 0 },
  ],
  preview: {
    select: { title: 'name', category: 'category', priceUSD: 'priceUSD', emoji: 'emoji' },
    prepare({ title, category, priceUSD, emoji }) {
      return { title: `${emoji || '📦'} ${title}`, subtitle: `[${category}] · US$${priceUSD?.toFixed(2) || '0.00'}` };
    },
  },
};
