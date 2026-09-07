export const LEETCODE_COLLECTION = 'leetcode' as const;
export const ZEROJUDGE_COLLECTION = 'zerojudge' as const;
export const ARTICLES_COLLECTION = 'articles' as const;

// localStorage 鍵名的唯一宣告處。
// 例外：is:inline script 無法 import —— Layout.astro 經 define:vars 傳入；
// LanguageToggle.astro 也使用共用鍵名。
export const STORAGE_KEYS = {
    isEnglish: "isEnglish",
    activeThemeId: "activeThemeId",
    customThemes: "customThemes",
    customAccentColor: "customAccentColor",
    hoverGlowEnabled: "hoverGlowEnabled",
    spotlightEnabled: "spotlightEnabled",
    sortPreference: "sortPreference",
    difficultyPreference: "difficultyPreference",
    tagPreference: "tagPreference",
} as const;

// 跨元件自訂事件名（producer/consumer 共用契約）。
export const EVENTS = {
    languageChange: "language-change",
    tagFilterChange: "tag-filter-change",
    sortChange: "sort-change",
    difficultyChange: "difficulty-change",
} as const;
