import type { Post, FilterCriteria, FilterResult } from "../types";

export class FilterEngine {
  filter(posts: Post[], criteria: FilterCriteria): FilterResult {
    const filtered = posts.filter(post => {
      // 1. 分類篩選（null 表示顯示所有分類）
      if (criteria.category !== null && post.category !== criteria.category) {
        return false;
      }

      // 2. 難度篩選
      if (criteria.difficulty !== "all") {
        const currentDiff = (criteria.difficulty || "").toLowerCase();
        const postDiff = (post.difficulty || "").toLowerCase();
        if (postDiff !== currentDiff) {
          return false;
        }
      }

      // 3. 標籤篩選（AND / OR 邏輯）
      if (criteria.tags.size > 0) {
        if (criteria.tagFilterLogic === "OR") {
          const hasAnyTag = Array.from(criteria.tags).some(tag =>
            post.tagsCN.includes(tag)
          );
          if (!hasAnyTag) return false;
        } else {
          // AND 邏輯（預設）
          const hasAllTags = Array.from(criteria.tags).every(tag =>
            post.tagsCN.includes(tag)
          );
          if (!hasAllTags) return false;
        }
      }

      // 4. 文本搜尋
      if (criteria.searchTerm) {
        const term = criteria.searchTerm.toLowerCase();
        if (!post.searchContent.toLowerCase().includes(term)) {
          return false;
        }
      }

      return true;
    });

    return {
      posts: filtered,
      count: filtered.length,
    };
  }
}
