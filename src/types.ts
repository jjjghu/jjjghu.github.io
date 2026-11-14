import type { CollectionEntry } from "astro:content";
import { LEETCODE_COLLECTION, ZEROJUDGE_COLLECTION } from "./constants";

export type PostEntry = CollectionEntry<typeof LEETCODE_COLLECTION> | CollectionEntry<typeof ZEROJUDGE_COLLECTION>;

export interface Post {
  id: string;                          // problem_id
  slug: string;                        // URL 路徑用
  category: "leetcode" | "zerojudge";

  // 雙語內容
  title: string;                       // 中文標題
  enTitle: string;                     // 英文標題
  tagsCN: string[];                    // 中文標籤
  tagEN: string[];                     // 英文標籤

  // 屬性
  difficulty: string;                  // "easy" | "medium" | "hard"
  date: number;                        // 時間戳（毫秒）

  // 搜尋用
  searchContent: string;               // 可搜尋的文本
}

export interface FilterCriteria {
  tags: Set<string>;                   // 選中的標籤（中文）
  tagFilterLogic: "AND" | "OR";
  difficulty: string | "all";
  category: string | null;
  searchTerm: string;
}

// 清單頁的完整狀態（單一來源，見 scripts/listState.ts）
export interface ListState {
  category: string;
  sort: SortConfig;
  difficulty: string;                  // 小寫難度或 "all"
  tags: string[];                      // 選中的標籤（中文）
  tagLogic: "AND" | "OR";
  searchTerm: string;
}

export interface SortConfig {
  field: "id" | "date";
  order: "asc" | "desc";
}
