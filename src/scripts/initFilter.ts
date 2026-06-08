import { initFilterSystem } from "./postFilter";

declare global {
  interface Window {
    __postsJson?: string;
  }
}

export function initializeFilter() {
  const postsJson = (window as any).__postsJson;
  if (!postsJson) {
    console.error("[initFilter] No posts data found");
    return;
  }

  try {
    const posts = JSON.parse(postsJson);
    console.log(`[initFilter] Starting initialization with ${posts.length} posts`);
    initFilterSystem(posts);
  } catch (error) {
    console.error("[initFilter] Error parsing posts:", error);
  }
}

// 自動初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFilter);
} else {
  initializeFilter();
}
