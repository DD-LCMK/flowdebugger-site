// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://errorledger.com',
	// Enforces non-trailing slashes across all generated routes, redirects, and sitemaps
	trailingSlash: 'never',
	// Forces Astro to output flat files (like 404.html) instead of folders
	build: {
		format: 'file',
	},
	integrations: [
		mdx(), 
		sitemap({
			changefreq: 'daily',
			priority: 0.7,
			lastmod: new Date()
		})
	],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});