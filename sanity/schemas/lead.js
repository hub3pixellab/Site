import { defineType, defineField } from 'sanity';

/**
 * @sanity Schema: lead (Arcade Lead Capture)
 * Upsert por nickname. Score é atualizado apenas se for maior que o existente.
 */
export default defineType({
  name: 'lead',
  title: 'Arcade Lead',
  type: 'document',
  fields: [
    defineField({
      name: 'nickname',
      title: 'Nickname',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(48),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) =>
        Rule.required().email().error('A valid e-mail is required'),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: (Rule) => Rule.required().min(6),
    }),
    defineField({
      name: 'score',
      title: 'Score',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: { title: 'nickname', subtitle: 'score' },
    prepare: ({ title, subtitle }) => ({
      title: title || 'unnamed',
      subtitle: `score: ${subtitle ?? 0}`,
    }),
  },
  orderings: [
    {
      title: 'Score (high → low)',
      name: 'scoreDesc',
      by: [{ field: 'score', direction: 'desc' }],
    },
  ],
});
