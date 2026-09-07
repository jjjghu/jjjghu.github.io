// src/content/config.ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { LEETCODE_COLLECTION, ZEROJUDGE_COLLECTION, ARTICLES_COLLECTION } from './constants';
import { isHttpUrl } from './utils/security';
import { fileToSlug } from './utils/slug-generator.mjs';

const httpUrl = z.string().refine(isHttpUrl, 'Expected an absolute HTTP(S) URL without credentials');
const optionalHttpUrl = z.preprocess(value => value === '' ? undefined : value, httpUrl.optional());
const postsSchema = z.object({
        title: z.string(),
        tags: z.array(z.string()), // 強制規定 tags 必須是陣列，寫錯會報錯
        date: z.string().refine(value => Number.isFinite(Date.parse(value)), 'Invalid date'),
        category: z.string(), // 來源網站
        problem_id: z.string(), // 題目ID
        difficulty: z.string().optional(), // 難度 (LeetCode: easy/medium/hard, CodeForce: number, ZeroJudge: null)
        link: optionalHttpUrl,
        en_title: z.string().optional(),
        en_link: optionalHttpUrl
    });

const contentLoader = (collection: string) => glob({
    pattern: ['**/*.md', '!**/.*'],
    base: `./src/content/${collection}`,
    generateId: ({ entry }) => fileToSlug(entry, null),
});

const postsCollection = (collection: string) => defineCollection({
    loader: contentLoader(collection),
    schema: postsSchema,
});

const articlesCollection = defineCollection({
    loader: contentLoader(ARTICLES_COLLECTION),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
    }),
});

export const collections = {
    [LEETCODE_COLLECTION]: postsCollection(LEETCODE_COLLECTION),
    [ZEROJUDGE_COLLECTION]: postsCollection(ZEROJUDGE_COLLECTION),
    [ARTICLES_COLLECTION]: articlesCollection,
};
