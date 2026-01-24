# 程式解題紀錄 (Coding Notes)

這是一個基於 [Astro](https://astro.build/) 構建的靜態網站，用於記錄 LeetCode、ZeroJudge 等平台的解題心得。網站支援多語言 (中/英)、標籤篩選、難度分類以及即時搜尋功能。

## 專案結構概覽

本專案採用元件化設計，核心邏輯與 UI 分離，以提升維護性。

### 1. 核心頁面 (Pages)
- **`src/pages/index.astro`**: 首頁。
    - 負責讀取並合併所有解題文章 (LeetCode + ZeroJudge)。
    - 初始化 `src/scripts/postFilter.ts` 中的篩選系統。
    - 渲染主要的篩選器 (`TagFilter`, `SortDropDown`, `DifficultyDropDown`) 和文章列表 (`PostRow`)。
- **`src/pages/[...slug].astro`**: 文章內頁。
    - 使用動態路由產生每一篇解題文章的頁面。
    - 負責渲染 Markdown 內容、目錄 (TOC) 以及切換該篇文章的中英文標題/連結。

### 2. 核心邏輯 (Logic & Utils)
- **`src/scripts/postFilter.ts`**: **首頁篩選的核心**。
    - 是一個 TypeScript Class (`PostFilterManager`)。
    - 負責監聽所有篩選器的事件 (`tag-filter-change`, `difficulty-change`, `sort-change`)。
    - 負責處理 URL 參數 (`?category=...`, `?q=...`)。
    - 執行實際的 DOM 隱藏/顯示操作來過濾文章。
    - 自動處理語言切換時的文字更新。
- **`src/i18n/ui.ts`**: **UI 文字中心**。
    - 集中管理所有介面上的文字 (如 "所有文章", "篩選標籤", "題號" 等) 及其對應的中英文翻譯。
- **`src/utils/postHelper.ts`**: 文章處理工具。
    - 包含排序邏輯 (`sortPostsById` - 支援純數字與英數混合 ID)。
    - 標籤處理 (`getAllUniqueTags`, `getTagCN`, `getTagEN`)，依賴 `data/tag_mapping.json` 進行中英轉換。
- **`src/utils/dateHelper.ts`**: 日期格式化工具。

### 3. 元件交互 (Components Interaction)

#### 首頁篩選流程
1.  **使用者操作**：例如點擊 `TagFilter` 的某個標籤。
2.  **發送事件**：`TagFilter.astro` 內部的 Script 發出自定義事件 `tag-filter-change`。
3.  **接收與處理**：`PostFilterManager` (在 `index.astro` 中初始化) 監聽到事件。
4.  **更新視圖**：`PostFilterManager` 根據當前的標籤、搜尋關鍵字、難度、分類，計算出哪些 `PostRow` 應該顯示，並修改其 `style.display`。

#### 多語言切換流程
1.  **切換按鈕**：使用者點擊 Header 或首頁的 `EN/中` 按鈕。
2.  **狀態更新**：`localStorage` 中的 `isEnglish` 狀態被切換。
3.  **DOM 更新**：
    -   `PostFilterManager` (首頁) 或內頁腳本會抓取所有帶有 `data-cn` / `data-en` 屬性的元素。
    -   根據當前語言將 `textContent` 替換為對應的屬性值。

## 新增文章

在 `src/content/` 下對應的資料夾 (如 `leetcode` 或 `zerojudge`) 建立 Markdown 檔案即可。
Frontmatter 範例：
```yaml
---
category: "leetcode"
title: "1. 兩數之和"
en_title: "1. Two Sum"
problem_id: "1"
difficulty: "easy"
tags: ["array", "hash-table"]
link: "https://leetcode.com/..."
date: "2023-01-01"
---
```

## 開發指令

- `npm run dev`: 啟動本地開發伺服器。
- `npm run build`: 建置靜態網站。
