// 主題註冊表：官方主題清單、預設值、localStorage schema 的唯一來源。
// 新增官方主題：在 OFFICIAL_THEMES 加一筆 + 在 public/styles/themes/ 放 CSS 檔。

export interface OfficialTheme {
    id: string;
    name: string;
    /** public 下的路徑；dark 與 light 的變數都在 global.css，故無 path */
    path?: string;
    /** 套用時是否在 <html> 加上 .light class */
    isLight?: boolean;
}

export const DEFAULT_THEME_ID = "dark";

export const OFFICIAL_THEMES: OfficialTheme[] = [
    { id: "dark", name: "深色主題 (Dark)" },
    // 變數定義在 global.css 的 html.light，不需要額外的 CSS 檔
    { id: "light", name: "淺色主題 (Light)", isLight: true },
    { id: "game", name: "遊戲主題 (Game)", path: "/styles/themes/game.css" },
];
