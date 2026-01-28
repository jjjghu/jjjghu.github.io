import tagMapping from "../data/tag_mapping.json";
import type { PostEntry } from "../types";

const tagMap: Record<string, string> = tagMapping;

// 根據日期排序文章 (新 -> 舊)
export function sortPostsByDate(posts: PostEntry[]) {
    return posts.sort(
        (a, b) =>
            new Date(b.data.date).valueOf() -
            new Date(a.data.date).valueOf(),
    );
}

// 根據題號排序文章 (小 -> 大)
// 根據題號排序文章 (小 -> 大)
export function sortPostsById(posts: PostEntry[]) {
    return posts.sort((a, b) => {
        const idA = a.data.problem_id;
        const idB = b.data.problem_id;

        const numA = Number(idA);
        const numB = Number(idB);

        const isNumA = !isNaN(numA);
        const isNumB = !isNaN(numB);

        if (isNumA && isNumB) {
            return numA - numB;
        }
        if (!isNumA && !isNumB) {
            return idA.localeCompare(idB); // String sort for non-numeric IDs
        }
        // Mixed: Numeric first (optional preference)
        return isNumA ? -1 : 1;
    });
}

// 建立反向映射 (中文 -> 英文)
const revTagMap: Record<string, string> = Object.fromEntries(
    Object.entries(tagMap).map(([en, cn]) => [cn, en])
);

export function getTagCN(tag: string) {
    return tagMap[tag] || tag;
}

export function getTagEN(tag: string) {
    return revTagMap[tag] || tag;
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
            if (!tagMap[tag] && !revTagMap[tag]) {
                console.warn(
                    `⚠️ 警告: 標籤 "${tag}" 尚未在 tag_mapping.json 中定義！`,
                );
            }
        });
    });
    return allTags;
}

// 保持向下兼容 (雖然主要建議用 getTagCN)
export function translateTag(tag: string) {
    return getTagCN(tag);
}

// 過濾掉隱藏的文章 (例如 .模板.md)
export function isPublicPost(post: PostEntry) {
    // 檢查檔名是否以 . 開頭
    const parts = post.id.split("/");
    const fileName = parts[parts.length - 1];
    return !fileName.startsWith(".");
}
