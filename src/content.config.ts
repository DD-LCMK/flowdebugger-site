import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
	schema: z.object({
		// Versioning & Contract
		pipeline_contract_version: z.string().optional(),

		// Core SEO & Header Metadata
		title: z.string().optional(),
		meta_title: z.string().optional(),
		description: z.string().optional(),
		pubDate: z.coerce.date().optional(),
		incidentDate: z.coerce.date().optional(), // Ingest actual incident/release date
		updatedDate: z.coerce.date().optional(),

		// Categorization & Keywords
		tags: z.array(z.string()).optional(),
		keyword: z.string().optional(),
		shortenedSlug: z.string().optional(),
		slug: z.string().optional(),

		// Technical Metadata (Version 27.0.0)
		target_systems: z.string().optional(),
		article_confidence: z.string().optional(),
		canonical_terminology: z.object({
			approved: z.array(z.string()),
		}).optional(),

		// Legacy / Hero Image Support
		heroImage: z.string().optional(),
	}).transform((data) => {
		// 1. Safe Title & Meta Title fallback resolving
		const rawTitle = data.title || data.meta_title || "Untitled Engineering Record";
		const rawMetaTitle = data.meta_title || data.title || "ErrorLedger Technical Analysis";
		const cleanMetaTitle = rawMetaTitle.length > 60 ? rawMetaTitle.slice(0, 57) + "..." : rawMetaTitle;

		// 2. Safe Description resolving with padding/bounds safeguards
		const rawDescription = data.description || "Detailed technical root cause analysis, architecture teardown, and operational post-mortem breakdown.";
		const cleanDescription = rawDescription.length < 120 
			? rawDescription.padEnd(120, ' ') 
			: rawDescription.length > 155 
				? rawDescription.slice(0, 152) + "..." 
				: rawDescription;

		// 3. Fallback date sorting guard
		const finalPubDate = data.pubDate || new Date();
		const finalIncidentDate = data.incidentDate || data.pubDate || new Date();

		// 4. Fallback Slug dynamic parser
		const baseSlug = data.slug || data.shortenedSlug || rawMetaTitle || "engineering-record";
		const cleanSlug = baseSlug
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
		const finalSlug = cleanSlug.split('-').slice(0, 6).join('-');

		// 5. Automatic Keyword Tag Ingestion fallback
		const inferredTags: string[] = data.tags || [];
		if (inferredTags.length === 0) {
			const lowerSearchText = (rawMetaTitle + " " + rawTitle + " " + finalSlug).toLowerCase();
			
			const ecosystemMap: Record<string, string> = {
				'responses-api': 'Responses API',
				'chat-completions': 'Chat Completions',
				'mcp': 'MCP Protocol',
				'supabase': 'Supabase',
				'stripe': 'Stripe',
				'clerk': 'Clerk',
				'auth0': 'Auth0',
				'firebase': 'Firebase',
				'prisma': 'Prisma',
				'mongodb': 'MongoDB',
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
				'github': 'GitHub',
				'node': 'Node.js',
				'crowdstrike': 'CrowdStrike',
				'windows': 'Windows'
			};

			const categoryMap: Record<string, string> = {
				'evolution': 'Engineering Evolution',
				'paradigm': 'Engineering Evolution',
				'architecture': 'Architecture Explainer',
				'protocol': 'Architecture Explainer',
				'auth': 'Auth',
				'database': 'Database',
				'payments': 'Payments',
				'webhook': 'Webhooks',
				'serverless': 'Serverless',
				'api': 'API Gateway',
				'cache': 'Cache',
				'orm': 'ORM',
				'outage': 'Service Outage',
				'crash': 'Service Outage',
				'bgp': 'BGP',
				'routing': 'BGP',
				'post-mortem': 'Incident Analysis'
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
				inferredTags.push("Engineering Analysis");
			}
		}

		return {
			...data,
			title: rawTitle,
			meta_title: cleanMetaTitle,
			description: cleanDescription,
			pubDate: finalPubDate,
			incidentDate: finalIncidentDate,
			tags: inferredTags,
			slug: finalSlug,
			shortenedSlug: finalSlug,
		};
	}),
});

const insights = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/insights" }),
	schema: z.object({
		title: z.string(),
		meta_title: z.string().optional(),
		description: z.string(),
		pubDate: z.coerce.date(),
		tags: z.array(z.string()).optional(),
		slug: z.string().optional(),
	}).transform((data) => {
		const baseSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
		const finalSlug = baseSlug.split('-').slice(0, 6).join('-');
		return {
			...data,
			shortenedSlug: finalSlug,
			tags: data.tags && data.tags.length > 0 ? data.tags : ["Insights"]
		};
	}),
});

export const collections = { blog, insights };