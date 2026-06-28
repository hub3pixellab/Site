import { defineType, defineField } from 'sanity';

/**
 * @sanity Schema: matchmaker (Tinder-Style Survey Questions)
 * yesVector / noVector aceitam exatamente: 'HouseLab' | 'PixelLab' | 'AppLab'
 */
const DIVISION_OPTIONS = [
  { title: 'House Lab', value: 'HouseLab' },
  { title: 'PixelLab',  value: 'PixelLab' },
  { title: 'AppLab',    value: 'AppLab' },
];

export default defineType({
  name: 'matchmaker',
  title: 'Matchmaker Question',
  type: 'document',
  fields: [
    defineField({
      name: 'questionId',
      title: 'Question ID',
      type: 'slug',
      options: { source: 'cardText', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cardText',
      title: 'Card Text (pain point)',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().min(8),
    }),
    defineField({
      name: 'yesVector',
      title: 'Yes Vector (division resolved)',
      type: 'string',
      options: { list: DIVISION_OPTIONS, layout: 'radio' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'noVector',
      title: 'No Vector (division skipped)',
      type: 'string',
      options: { list: DIVISION_OPTIONS, layout: 'radio' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: 'cardText', subtitle: 'yesVector', order: 'sortOrder' },
    prepare: ({ title, subtitle, order }) => ({
      title: title || 'untitled question',
      subtitle: `#${order ?? 0} → ${subtitle ?? '?'}`,
    }),
  },
  orderings: [
    {
      title: 'Sort Order (asc)',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],
});
