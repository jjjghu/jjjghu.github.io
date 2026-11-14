// 清單頁的核心邏輯（純函式，不碰 DOM / storage）：
// 偏好解析與驗證、篩選、排序。瀏覽器端的接線在 listState.ts。
import type { Post, FilterCriteria, SortConfig, ListState } from "../types";

/** 題號的全序：純數字依數值並排在前，其餘依字串。建置與瀏覽器端共用。 */
export function compareProblemIds(a: string, b: string): number {
  const isNumA = a.trim() !== "" && !isNaN(Number(a));
  const isNumB = b.trim() !== "" && !isNaN(Number(b));
  if (isNumA && isNumB) return Number(a) - Number(b);
  if (isNumA !== isNumB) return isNumA ? -1 : 1;
  return a.localeCompare(b);
}

export function filterPosts(posts: Post[], criteria: FilterCriteria): Post[] {
  const tags = [...criteria.tags];
  const term = criteria.searchTerm.toLowerCase();
  const difficulty = criteria.difficulty.toLowerCase();

  return posts.filter((post) => {
    // null 表示顯示所有分類
    if (criteria.category !== null && post.category !== criteria.category) return false;
    if (difficulty !== "all" && post.difficulty.toLowerCase() !== difficulty) return false;
    if (tags.length > 0) {
      const has = (tag: string) => post.tagsCN.includes(tag);
      if (!(criteria.tagFilterLogic === "OR" ? tags.some(has) : tags.every(has))) return false;
    }
    return !term || post.searchContent.toLowerCase().includes(term);
  });
}

export function sortPosts(posts: Post[], config: SortConfig): Post[] {
  const direction = config.order === "asc" ? 1 : -1;
  return [...posts].sort(
    (a, b) => direction * (config.field === "date" ? a.date - b.date : compareProblemIds(a.id, b.id)),
  );
}

/** 某分類實際出現的難度（小寫）。 */
export function difficultiesIn(posts: Post[], category: string): Set<string> {
  return new Set(
    posts.filter((p) => p.category === category && p.difficulty).map((p) => p.difficulty.toLowerCase()),
  );
}

/** 儲存的原始偏好字串（可能為 null 或損壞）。 */
export interface StoredPreferences {
  sort: string | null;        // "id-asc"
  difficulty: string | null;  // "hard"
  tags: string | null;        // '{"tags":[...],"logic":"AND"}'
}

/** 把儲存的偏好解析成有效狀態；難度若不屬於目前分類則退回 "all"。 */
export function parseListState(stored: StoredPreferences, category: string, posts: Post[]): ListState {
  const [field, order] = (stored.sort ?? "").split("-");

  let tags: string[] = [];
  let tagLogic: ListState["tagLogic"] = "AND";
  try {
    const parsed = JSON.parse(stored.tags ?? "{}");
    if (Array.isArray(parsed?.tags)) tags = parsed.tags.filter((tag: unknown) => typeof tag === "string");
    if (parsed?.logic === "OR") tagLogic = "OR";
  } catch { /* 損壞的偏好視為未設定 */ }

  const difficulty = (stored.difficulty ?? "all").toLowerCase();

  return {
    category,
    sort: { field: field === "date" ? "date" : "id", order: order === "desc" ? "desc" : "asc" },
    difficulty: difficultiesIn(posts, category).has(difficulty) ? difficulty : "all",
    tags,
    tagLogic,
    searchTerm: "",
  };
}

/** 依狀態算出要顯示的文章與順序。 */
export function selectPosts(posts: Post[], state: ListState): Post[] {
  return sortPosts(
    filterPosts(posts, {
      category: state.category,
      difficulty: state.difficulty,
      tags: new Set(state.tags),
      tagFilterLogic: state.tagLogic,
      searchTerm: state.searchTerm,
    }),
    state.sort,
  );
}
