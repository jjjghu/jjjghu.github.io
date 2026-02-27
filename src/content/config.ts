// src/content/config.ts
import { z, defineCollection } from 'astro:content';
import { LEETCODE_COLLECTION, ZEROJUDGE_COLLECTION, ROADMAP_COLLECTION, GUIDE_COLLECTION } from '../constants';
const postsCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        tags: z.array(z.string()), // 強制規定 tags 必須是陣列，寫錯會報錯
        date: z.string(),
        category: z.string(), // 來源網站
        problem_id: z.string(), // 題目ID
        difficulty: z.string().optional(), // 難度 (LeetCode: easy/medium/hard, CodeForce: number, ZeroJudge: null)
        link: z.string().optional(), // ZeroJudge often has fixed ID link, maybe optional? But schema said link previously. User edited md to have link.
        en_title: z.string().optional(),
        en_link: z.string().optional()
    }),
});

const roadmapCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
    }),
});

const guideCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
    }),
});

export const collections = {
    [LEETCODE_COLLECTION]: postsCollection,
    [ZEROJUDGE_COLLECTION]: postsCollection,
    [ROADMAP_COLLECTION]: roadmapCollection,
    [GUIDE_COLLECTION]: guideCollection,
};