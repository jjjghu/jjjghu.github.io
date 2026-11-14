import tagMapping from "../data/tag_mapping.json";
import { getCollection } from "astro:content";
import { LEETCODE_COLLECTION, ZEROJUDGE_COLLECTION } from "../constants";
import { generateSlug } from "./slug-generator.mjs";
import { sortDifficulties } from "./difficulty";
import { compareProblemIds } from "../scripts/postList";
import type { Post, PostEntry } from "../types";

const tagMap: Record<string, string> = tagMapping;

// 文章的公開 URL slug（entry.id 已由 content loader slug 化，這裡去掉題號前綴）
export const postSlug = (post: PostEntry): string => generateSlug(post.id, post.data.problem_id);

// 所有公開文章（leetcode + zerojudge），依題號排序
export async function getPublicPosts(): Promise<PostEntry[]> {
    const collections = await Promise.all([
        getCollection(LEETCODE_COLLECTION, isPublicPost),
        getCollection(ZEROJUDGE_COLLECTION, isPublicPost),
    ]);
    return collections.flat().sort((a, b) => compareProblemIds(a.data.problem_id, b.data.problem_id));
}

// 內容條目 -> 清單頁用的 Post
export function toPost(post: PostEntry): Post {
    const { data } = post;
    return {
        id: data.problem_id || post.id, // problem_id 為空時用 slug
        slug: postSlug(post),
        category: data.category === "zerojudge" ? "zerojudge" : "leetcode",
        title: data.title,
        enTitle: data.en_title ?? "",
        tagsCN: data.tags.map(getTagCN),
        tagEN: data.tags,
        difficulty: data.difficulty ?? "",
        date: new Date(data.date).getTime(),
        searchContent: [data.problem_id, data.title, data.en_title ?? "", ...data.tags].join(" ").toLowerCase(),
    };
}

// 建立反向映射 (中文 -> 英文)
const revTagMap: Record<string, string> = Object.fromEntries(
    Object.entries(tagMap).map(([en, cn]) => [cn, en])
);

export function getTagCN(tag: string) {
    return Object.hasOwn(tagMap, tag) ? tagMap[tag] : tag;
}

export function getTagEN(tag: string) {
    return Object.hasOwn(revTagMap, tag) ? revTagMap[tag] : tag;
}

// 取得所有不重複標籤 (統一轉為中文以避免中英混用時出現重複選項)
export function getAllUniqueTags(posts: PostEntry[]) {
    const allTags = new Set<string>();
    posts.forEach((post) => {
        const tags = post.data.tags || [];
        tags.forEach((tag: string) => {
            const cnTag = getTagCN(tag);
            allTags.add(cnTag);

            // 檢查是否為未定義的標籤 (既不是已知英文 Key，也不是已知中文 Value)
            // 如果 input 是 "array" -> tagMap 有 (ok)
            // 如果 input 是 "數組" -> tagMap 無, 但 revTagMap 有 (ok)
            // 如果 input 是 "unknown" -> 兩個都無 (warn)
            if (!Object.hasOwn(tagMap, tag) && !Object.hasOwn(revTagMap, tag)) {
                console.warn(
                    `⚠️ 警告: 標籤 "${tag}" 尚未在 tag_mapping.json 中定義！`,
                );
            }
        });
    });
    return allTags;
}

// 取得所有不重複難度（依難度表順序）
export function getAllUniqueDifficulties(posts: PostEntry[]) {
    return sortDifficulties(new Set(posts.flatMap((post) => post.data.difficulty || [])));
}

// 過濾掉隱藏的文章 (例如 .模板.md)
export function isPublicPost(post: PostEntry) {
    // 檢查檔名是否以 . 開頭
    const parts = post.id.split("/");
    const fileName = parts[parts.length - 1];
    return !fileName.startsWith(".");
}
