/**
 * Whitepaper (singleton) — armazena o PDF corrente do whitepaper HUB3.
 * O Studio permite substituir o arquivo sem redeploy do site.
 * A rota `/api/whitepaper` faz proxy do arquivo mais recente publicado.
 */
export default {
  name: 'whitepaper',
  title: 'Whitepaper',
  type: 'document',
  // Torna singleton via structure: opção de UX; validação de unicidade fica no Studio.
  fields: [
    {
      name: 'title',
      title: 'Título (versão)',
      type: 'string',
      description: 'Ex: HUB3 Whitepaper v1.0',
      validation: (R) => R.required().min(3).max(80),
    },
    {
      name: 'version',
      title: 'Versão',
      type: 'string',
      description: 'Ex: 1.0.0',
    },
    {
      name: 'pdf',
      title: 'Arquivo PDF',
      type: 'file',
      options: { accept: 'application/pdf' },
      validation: (R) => R.required(),
    },
    {
      name: 'coverImage',
      title: 'Capa (opcional)',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'published',
      title: 'Publicado',
      type: 'boolean',
      description: 'Somente 1 whitepaper deve estar publicado por vez. O site usa o mais recente com `published=true`.',
      initialValue: true,
    },
    {
      name: 'updatedAt',
      title: 'Atualizado em',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
  ],
  preview: {
    select: { title: 'title', version: 'version', updatedAt: 'updatedAt', published: 'published' },
    prepare({ title, version, updatedAt, published }) {
      return {
        title: title || 'Whitepaper',
        subtitle: `${version || 'v?'} · ${published ? 'publicado' : 'rascunho'} · ${updatedAt ? new Date(updatedAt).toLocaleDateString('pt-BR') : ''}`,
      };
    },
  },
};
