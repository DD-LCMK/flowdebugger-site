import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
	schema: z.object({
		title: z.string().optional(),
		meta_title: z.string().optional(),
		description: z.string().optional(),
		pubDate: z.coerce.date().optional(),
		tags: z.array(z.string()).optional(),
		slug: z.string().optional(),
	}).transform((data) => {
		// 1. Safe Title & Meta Title fallback resolving
		const rawTitle = data.title || data.meta_title || "Untitled Incident Record";
		const rawMetaTitle = data.meta_title || data.title || "ErrorLedger Technical Post-Mortem";
		const cleanMetaTitle = rawMetaTitle.length > 60 ? rawMetaTitle.slice(0, 57) + "..." : rawMetaTitle;

		// 2. Safe Description resolving with padding/bounds safeguards
		const rawDescription = data.description || "Detailed technical root cause analysis, forensic telemetry deconstruction, and architectural post-mortem breakdown of this major system incident.";
		const cleanDescription = rawDescription.length < 120 
			? rawDescription.padEnd(120, ' ') 
			: rawDescription.length > 155 
				? rawDescription.slice(0, 152) + "..." 
				: rawDescription;

		// 3. Fallback date sorting guard (defaults to current date if missing)
		const finalPubDate = data.pubDate || new Date();

		// 4. Fallback Slug dynamic parser
		const baseSlug = data.slug || rawMetaTitle || "incident-record";
		const cleanSlug = baseSlug
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
		const finalSlug = cleanSlug.split('-').slice(0, 6).join('-');

		// 5. Automatic 3-Tier Keyword Tag Ingestion fallback
		const inferredTags: string[] = data.tags || [];
		if (inferredTags.length === 0) {
			const lowerSearchText = (rawMetaTitle + " " + rawTitle + " " + finalSlug).toLowerCase();
			
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
				'node': 'Node.js',
				'crowdstrike': 'CrowdStrike',
				'windows': 'Windows'
			};

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
				'graphql': 'API Gateway',
				'outage': 'Service Outage',
				'crash': 'Service Outage',
				'bgp': 'BGP',
				'routing': 'BGP',
				'post-mortem': 'Incident Analysis',
				'outage-report': 'Incident Analysis'
			};

			Object.entries(ecosystemMap)
				.sort((a, b) => b[0].length - a[0].length)
				.forEach(([keyword, formattedTag]) => {
					if (lowerSearchText.includes(keyword) && !inferredTags.includes(formattedTag)) {
						inferredTags.push(formattedTag);
					}
				});

			Object.entries(categoryMap).forEach(([keyword, formattedTag]) => {
				if (lowerSearchText.includes(keyword) && !inferredTags.includes(formattedTag)) {
					inferredTags.push(formattedTag);
				}
			});

			if (inferredTags.length === 0) {
				inferredTags.push("Incident Analysis");
			}
		}

		return {
			title: rawTitle,
			meta_title: cleanMetaTitle,
			description: cleanDescription,
			pubDate: finalPubDate,
			tags: inferredTags,
			slug: finalSlug,
			shortenedSlug: finalSlug,
		};
	}),
});

export const collections = { blog };