export const LEETCODE_COLLECTION = 'leetcode' as const;
export const ZEROJUDGE_COLLECTION = 'zerojudge' as const;
export const ARTICLES_COLLECTION = 'articles' as const;

// localStorage 鍵名的唯一宣告處。
// 例外：is:inline script 無法 import —— Layout.astro 經 define:vars 傳入；
// LanguageToggle.astro 為避免語言閃爍維持 inline，內含 "isEnglish" 字面值，改名時需同步。
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
// 例外：LanguageToggle.astro（is:inline）內含 "language-change" 字面值。
export const EVENTS = {
    languageChange: "language-change",
    tagFilterChange: "tag-filter-change",
    sortChange: "sort-change",
    difficultyChange: "difficulty-change",
} as const;
