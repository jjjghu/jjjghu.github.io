// 清單頁狀態的單一來源（瀏覽器端）。
// 下拉元件與清單都 subscribe 這裡；使用者操作一律走 update()。
import { storage } from "./storage";
import { STORAGE_KEYS } from "../constants";
import { parseListState, selectPosts, difficultiesIn } from "./postList";
import type { Post, ListState } from "../types";

const posts: Post[] = JSON.parse(document.getElementById("posts-data")?.textContent || "[]");
const category = new URLSearchParams(window.location.search).get("category") || "leetcode";

let state = parseListState(
  {
    sort: storage.getItem(STORAGE_KEYS.sortPreference),
    difficulty: storage.getItem(STORAGE_KEYS.difficultyPreference),
    tags: storage.getItem(STORAGE_KEYS.tagPreference),
  },
  category,
  posts,
);

type Listener = (state: ListState) => void;
const listeners = new Set<Listener>();

export const listState = {
  /** 目前分類實際有的難度（小寫）。 */
  difficulties: difficultiesIn(posts, category),

  /** 註冊並立即以目前狀態呼叫一次，所以不依賴 script 執行順序。 */
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(state);
  },

  /** 只持久化這次變更的欄位，避免把另一個分類的難度偏好覆寫掉。 */
  update(patch: Partial<Omit<ListState, "category">>) {
    state = { ...state, ...patch };
    if (patch.sort) storage.setItem(STORAGE_KEYS.sortPreference, `${state.sort.field}-${state.sort.order}`);
    if (patch.difficulty !== undefined) storage.setItem(STORAGE_KEYS.difficultyPreference, state.difficulty);
    if (patch.tags || patch.tagLogic) {
      storage.setItem(STORAGE_KEYS.tagPreference, JSON.stringify({ tags: state.tags, logic: state.tagLogic }));
    }
    listeners.forEach((listener) => listener(state));
  },

  visible: () => selectPosts(posts, state),
};
