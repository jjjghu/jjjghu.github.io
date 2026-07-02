// 主題註冊表：官方主題清單、預設值、localStorage schema 的唯一來源。
// 新增官方主題：在 OFFICIAL_THEMES 加一筆 + 在 public/styles/themes/ 放 CSS 檔。

export interface OfficialTheme {
    id: string;
    name: string;
    /** public 下的路徑；預設主題（dark）不需注入 CSS，故無 path */
    path?: string;
    /** 套用時是否在 <html> 加上 .light class */
    isLight?: boolean;
}

export const DEFAULT_THEME_ID = "dark";

export const OFFICIAL_THEMES: OfficialTheme[] = [
    { id: "dark", name: "深色主題 (Dark)" },
    { id: "light", name: "淺色主題 (Light)", path: "/styles/themes/light.css", isLight: true },
    { id: "game", name: "遊戲主題 (Game)", path: "/styles/themes/game.css" },
];
