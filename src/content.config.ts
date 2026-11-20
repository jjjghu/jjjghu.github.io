// src/content/config.ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { LEETCODE_COLLECTION, ZEROJUDGE_COLLECTION, ARTICLES_COLLECTION, BEYOND_COLLECTION } from './constants';
import { isHttpUrl } from './utils/security';
import { fileToSlug } from './utils/slug-generator.mjs';
import { isKnownDifficulty } from './utils/difficulty';

const httpUrl = z.string().refine(isHttpUrl, 'Expected an absolute HTTP(S) URL without credentials');
const optionalHttpUrl = z.preprocess(value => value === '' ? undefined : value, httpUrl.optional());
const postsSchema = z.object({
        title: z.string(),
        tags: z.array(z.string()), // 強制規定 tags 必須是陣列，寫錯會報錯
        date: z.string().refine(value => Number.isFinite(Date.parse(value)), 'Invalid date'),
        category: z.string(), // 來源網站
        problem_id: z.string(), // 題目ID
        difficulty: z.string().refine(isKnownDifficulty, '難度不在 utils/difficulty.ts 的難度表內').optional(),
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

const validDate = z.string().refine(value => Number.isFinite(Date.parse(value)), 'Invalid date');

const beyondCollection = defineCollection({
    // drafts/ 是還沒決定要不要發布的草稿：只在開發模式載入，而且整個資料夾不進 git。
    // 長期紀錄/ 只是讓這些常改的檔案在編輯器裡固定排在最上面；網址仍是 /beyond/<檔名>/。
    loader: glob({
        pattern: import.meta.env.DEV ? '**/*.md' : ['*.md', '長期紀錄/*.md'],
        base: `./src/content/${BEYOND_COLLECTION}`,
        generateId: ({ entry }) => entry.split('/').pop()!.replace(/\.md$/, ''),
    }),
    // 欄位都可省略：日期預設取自檔名，標題預設就是日期（見 utils/beyond.ts）
    schema: z.object({
        title: z.string().optional(),
        date: validDate.optional(),
        // 長期紀錄在列表上的小圖示（圖形定義在 pages/beyond/index.astro）
        icon: z.enum(['gamepad', 'play']).optional(),
    }),
});

export const collections = {
    [LEETCODE_COLLECTION]: postsCollection(LEETCODE_COLLECTION),
    [ZEROJUDGE_COLLECTION]: postsCollection(ZEROJUDGE_COLLECTION),
    [ARTICLES_COLLECTION]: articlesCollection,
    [BEYOND_COLLECTION]: beyondCollection,
};
