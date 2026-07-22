import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
	const blog = await getCollection('blog');
	const insights = await getCollection('insights');
	
	// Merge streams and order chronologically by date
	const allPosts = [...blog, ...insights].sort(
		(a, b) => new Date(b.data.pubDate).valueOf() - new Date(a.data.pubDate).valueOf()
	);

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site || 'https://errorledger.com',
		items: allPosts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			// Clean URL output without trailing slashes to match canonical site routing
			link: `/${post.collection}/${post.data.shortenedSlug || post.slug}`,
		})),
	});
}