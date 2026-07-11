import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
type: 'content',
schema: z.object({
title: z.string().optional(),
meta_title: z.string().optional(),
description: z.string().optional(),
meta_description: z.string().optional(),
pubDate: z.coerce.date().optional(),
pipeline_contract_version: z.string().optional(),
slug: z.string().optional(),
validated_environments: z.array(z.string()).optional(),
}).transform((data) => ({
title: data.meta_title || data.title || "Untitled Post",
description: data.meta_description || data.description || "",
pubDate: data.pubDate || new Date(),
})),
});

export const collections = { blog };
