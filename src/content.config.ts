import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		meta_title: z.string().max(60),
		description: z.string().min(120).max(155),
		pubDate: z.coerce.date(),
		tags: z.array(z.string()),
		slug: z.string().optional(),
	}).transform((data) => {
		// Prioritize explicit slug fields, fallback to slugified titles
		const baseSlug = data.slug || data.meta_title || data.title || "incident";
		const cleanSlug = baseSlug
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
		
		// Constrain fallback slug path lengths
		const fallbackSlug = cleanSlug.split('-').slice(0, 6).join('-');
		const finalSlug = data.slug || fallbackSlug;

		return {
			title: data.title,
			meta_title: data.meta_title,
			description: data.description,
			pubDate: data.pubDate,
			tags: data.tags,
			slug: finalSlug,
			shortenedSlug: finalSlug, // Preserves path parameters for the router
		};
	}),
});

export const collections = { blog };