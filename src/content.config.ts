import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['hobby', 'professional']),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// One comprehensive file per trip: `<slug>/<slug>.md`, with all days as a
// frontmatter array. GPX tracks and pictures are colocated flat in the same
// folder and referenced by filename.
const trips = defineCollection({
  loader: glob({ pattern: '*/*.{md,mdx}', base: './src/content/trips' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      location: z.string(),
      country: z.string().optional(),
      coverImage: image().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      days: z
        .array(
          z.object({
            date: z.coerce.date(),
            title: z.string(),
            places: z.array(z.string()).default([]),
            activities: z.array(z.string()).default([]),
            notes: z.string().optional(),
            images: z.array(image()).default([]),
            // Filename of a colocated .gpx file (relative to the trip folder), e.g. "./ride.gpx".
            gpx: z.string().optional(),
          }),
        )
        .default([]),
    }),
});

export const collections = { articles, trips };
