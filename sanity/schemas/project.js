import { defineType, defineField } from 'sanity';

/**
 * @sanity Schema: project (Dynamic Portfolio Management)
 */
const DIVISIONS = [
  { title: 'House Lab', value: 'House Lab' },
  { title: 'PixelLab',  value: 'PixelLab' },
  { title: 'AppLab',    value: 'AppLab' },
];

export default defineType({
  name: 'project',
  title: 'Portfolio Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2),
    }),
    defineField({
      name: 'division',
      title: 'Division',
      type: 'string',
      options: { list: DIVISIONS, layout: 'radio' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caseSlug',
      title: 'Case Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().min(10),
    }),
    defineField({
      name: 'marketVertical',
      title: 'Market Vertical',
      type: 'string',
    }),
    defineField({
      name: 'blockChainTech',
      title: 'Blockchain Technology Used',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'smartContractsUsed',
      title: 'Smart Contracts Used',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'liveUrl',
      title: 'Live URL',
      type: 'url',
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'tags',
      title: 'Technical Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'metrics',
      title: 'Metrics',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'k', type: 'string', title: 'Key' },
            { name: 'v', type: 'string', title: 'Value' },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'division' },
  },
});
