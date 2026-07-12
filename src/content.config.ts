import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
	schema: z.object({
		title: z.string().optional(),
		meta_title: z.string().optional(),
		description: z.string().optional(),
		meta_description: z.string().optional(),
		pubDate: z.coerce.date().optional(),
		slug: z.string().optional(),
		tags: z.array(z.string()).optional(),
	}).transform((data) => {
		const baseString = data.slug || data.meta_title || data.title || "post";
		
		const cleanSlug = baseString
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');

		const shortSlug = cleanSlug.split('-').slice(0, 5).join('-');
		
		// 1. Initialize tags from frontmatter if explicitly provided
		const inferredTags: string[] = data.tags || [];
		
		if (inferredTags.length === 0) {
			// FIX: Fall back to meta_title or slug strings since frontmatter prioritizes meta_title
			const lowerTitle = (data.meta_title || data.title || data.slug || "").toLowerCase();
			
			// 2. Definitive Core Ecosystem Vocabulary Dictionary
			const ecosystemMap: Record<string, string> = {
				'supabase': 'Supabase',
				'stripe': 'Stripe',
				'clerk': 'Clerk',
				'auth0': 'Auth0',
				'firebase': 'Firebase',
				'prisma': 'Prisma',
				'mongodb': 'MongoDB',
				'mongoose': 'Mongoose',
				'redis': 'Redis',
				'sentry': 'Sentry',
				'openai': 'OpenAI',
				'anthropic': 'Anthropic',
				'claude': 'Claude',
				'resend': 'Resend',
				'sendgrid': 'SendGrid',
				'vercel': 'Vercel',
				'slack': 'Slack',
				'aws': 'AWS',
				'lambda': 'Lambda',
				'cloudflare': 'Cloudflare',
				'wrangler': 'Wrangler',
				'zapier': 'Zapier',
				'make.com': 'Make.com',
				'airtable': 'Airtable',
				'github': 'GitHub',
				'octokit': 'Octokit',
				'node': 'Node.js'
			};

			// 3. Structural Category Categorization Layer
			const categoryMap: Record<string, string> = {
				'auth': 'Auth',
				'database': 'Database',
				'policy': 'Database',
				'rls': 'Database',
				'payments': 'Payments',
				'signature': 'Webhooks',
				'webhook': 'Webhooks',
				'serverless': 'Serverless',
				'functions': 'Serverless',
				'api': 'API Gateway',
				'cache': 'Cache',
				'orm': 'ORM',
				'email': 'Email',
				'devops': 'DevOps',
				'graphql': 'API Gateway'
			};

			// Corrected Array Sorting Chain Syntax
			Object.entries(ecosystemMap)
				.sort((a, b) => b[0].length - a[0].length)
				.forEach(([keyword, formattedTag]) => {
					if (lowerTitle.includes(keyword) && !inferredTags.includes(formattedTag)) {
						inferredTags.push(formattedTag);
					}
				});

			// Extract cross-cutting layer categories from the Title String
			Object.entries(categoryMap).forEach(([keyword, formattedTag]) => {
				if (lowerTitle.includes(keyword) && !inferredTags.includes(formattedTag)) {
					inferredTags.push(formattedTag);
				}
			});

			// 4. Clean up cross-dependencies and fallback strings
			if (inferredTags.length === 0) {
				inferredTags.push("Backend");
			}
		}
		
		return {
			title: data.meta_title || data.title || "Untitled Post",
			description: data.meta_description || data.description || "",
			pubDate: data.pubDate, // Corrected: Keeps missing dates undefined so they drop to the bottom
			shortenedSlug: shortSlug,
			tags: inferredTags,
		};
	}),
});

export const collections = { blog };