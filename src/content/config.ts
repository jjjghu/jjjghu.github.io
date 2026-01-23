// src/content/config.ts
import { z, defineCollection } from 'astro:content';
import { LEETCODE_COLLECTION } from '../constants';
const postsCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        tags: z.array(z.string()), // 強制規定 tags 必須是陣列，寫錯會報錯
        date: z.string(),
        category: z.string(), // 來源網站
        problem_id: z.string(), // 題目ID
        difficulty: z.string(), // 難度
        link: z.string(),
        en_title: z.string().optional(),
        en_link: z.string().optional()
    }),
});
export const collections = {
    [LEETCODE_COLLECTION]: postsCollection, // key 'LeetCode' 對應資料夾名稱 src/content/LeetCode
};