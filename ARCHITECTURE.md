# 架構文檔 (Architecture)

## 概述

本專案採用**分層架構**，將篩選、排序邏輯從 DOM 操作中解離，提升代碼可測試性、可維護性和可複用性。

```
User Input (篩選器、搜尋框)
    ↓
PostFilterManager (事件監聽、狀態管理)
    ↓
FilterEngine (篩選邏輯) ← 獨立、純函數、可單元測試
SortEngine (排序邏輯) ← 獨立、純函數、可單元測試
    ↓
DOM 更新 (顯示/隱藏 PostRow)
```

---

## 核心模塊

### 1. **FilterEngine.ts** - 篩選邏輯引擎

**職責**：接收 Posts 和篩選條件，返回符合條件的 Posts。

**特點**：
- 純邏輯層：不涉及 DOM、localStorage 或網絡請求
- 所有輸入都來自參數，所有輸出通過返回值
- 支援單元測試（同樣輸入 → 永遠同樣輸出）

**公開方法**：
```typescript
filter(posts: Post[], criteria: FilterCriteria): FilterResult
```

**篩選支援**：
1. **分類篩選** (`category`)
   - `category === null` 時顯示所有分類
   - `category === "leetcode"` 時只顯示 LeetCode 題目

2. **難度篩選** (`difficulty`)
   - `difficulty === "all"` 時顯示所有難度
   - `difficulty === "easy"` / `"medium"` / `"hard"` 時只顯示該難度

3. **標籤篩選** (`tags` + `tagFilterLogic`)
   - **AND 邏輯**（預設）：題目必須包含所有選中標籤
     ```
     選中: ['陣列', '雜湊表']
     題目標籤: ['陣列', '雜湊表'] → ✅ 顯示
     題目標籤: ['陣列'] → ❌ 隱藏
     ```
   - **OR 邏輯**：題目只要包含任一選中標籤即可
     ```
     選中: ['陣列', '鏈表']
     題目標籤: ['陣列'] → ✅ 顯示
     題目標籤: ['鏈表'] → ✅ 顯示
     題目標籤: ['動態規劃'] → ❌ 隱藏
     ```

4. **文本搜尋** (`searchTerm`)
   - 不區分大小寫搜尋 `post.searchContent`
   - 空搜尋詞時跳過此篩選

5. **組合篩選**
   - 所有篩選條件同時生效（AND 邏輯）
   - 例：只顯示 "LeetCode + easy + 陣列標籤" 的題目

**範例**：
```typescript
const engine = new FilterEngine();
const criteria: FilterCriteria = {
  tags: new Set(['陣列']),
  tagFilterLogic: 'AND',
  difficulty: 'easy',
  category: 'leetcode',
  searchTerm: '',
};

const result = engine.filter(allPosts, criteria);
console.log(result.posts); // 符合條件的題目
console.log(result.count); // 結果數量
```

---

### 2. **SortEngine.ts** - 排序邏輯引擎

**職責**：接收 Posts，按指定方式排序並返回新陣列。

**特點**：
- 純邏輯層：不修改原陣列（返回新陣列）
- 支援數字 ID 和混合型 ID 的正確排序
- 支援日期排序

**公開方法**：
```typescript
sort(posts: Post[], config: SortConfig): Post[]
```

**排序支援**：
1. **按 ID 排序** (`field === "id"`)
   - **純數字 ID**：按數值大小排序
     ```
     ID: ['10', '2', '30'] + asc
     → ['2', '10', '30']  // 數值排序，不是字符排序
     ```
   - **混合型 ID**（含字母）：按字符順序排序
     ```
     ID: ['10', '2a', '5'] + asc
     → ['10', '2a', '5']  // 字符排序
     ```

2. **按日期排序** (`field === "date"`)
   - 按時間戳大小排序
   - 升序：最舊 → 最新
   - 降序：最新 → 最舊

**範例**：
```typescript
const engine = new SortEngine();

// 按 ID 升序
const sorted = engine.sort(posts, { field: 'id', order: 'asc' });

// 按日期降序（最新優先）
const sorted = engine.sort(posts, { field: 'date', order: 'desc' });
```

---

### 3. **PostFilterManager** - 編排層

**職責**：
- 監聽用戶操作事件（標籤變更、搜尋、排序）
- 管理篩選狀態（儲存到 localStorage）
- 調用 FilterEngine 和 SortEngine 進行計算
- 更新 DOM（顯示/隱藏 PostRow）
- 處理語言切換

**不再關心**：
- 篩選邏輯的細節（交給 FilterEngine）
- 排序邏輯的細節（交給 SortEngine）

**事件流**：
```
用戶點擊標籤
    ↓
TagFilter.astro 發出 "tag-filter-change" 事件
    ↓
PostFilterManager 監聽到事件，更新內部狀態
    ↓
調用 FilterEngine.filter() 和 SortEngine.sort()
    ↓
遍歷所有 PostRow 元素，根據結果更新 display
```

---

## 數據流圖

### 首頁初始載入
```
index.astro
  ↓
1. 讀取所有 Posts (LeetCode + ZeroJudge)
2. 轉換為 Post[] (統一格式)
3. 內聯 PostFilterManager 初始化代碼
4. PostFilterManager 監聽篩選器事件
5. 初次篩選：按 URL 參數 (category, q) 執行
6. 移除 FOUC 隱藏類，顯示結果
```

### 用戶操作篩選
```
User Input (點擊標籤、輸入搜尋詞等)
    ↓
PostFilterManager.handleXxxChange()
    ↓
更新 criteria 狀態
    ↓
FilterEngine.filter(posts, criteria)
    ↓
返回 FilterResult { posts, count }
    ↓
SortEngine.sort(filteredPosts, sortConfig)
    ↓
返回排序後的 Posts
    ↓
遍歷 DOM 中所有 PostRow，根據結果更新 style.display
    ↓
儲存狀態到 localStorage
```

---

## 設計原則

### 1. **數據優先設計 (Data-Driven)**
- 邏輯從 DOM 分離，所有計算基於數據
- FilterEngine/SortEngine 不知道 DOM 存在
- 易於測試、易於複用

### 2. **單一職責**
- **FilterEngine**：只負責篩選邏輯
- **SortEngine**：只負責排序邏輯
- **PostFilterManager**：只負責事件監聽和 DOM 更新協調

### 3. **可測試性**
- FilterEngine 和 SortEngine 都是純函數
- 可獨立進行單元測試（不需要 DOM 或其他副作用）
- 24 個單元測試覆蓋核心行為

### 4. **內聯邏輯（為何不是獨立模塊？）**
雖然 FilterEngine/SortEngine 是獨立的，但在 `index.astro` 中內聯了初始化代碼：

**原因**：
```
Astro 路由規則：[...slug].astro 動態路由攔截所有請求
問題：/scripts/postFilter.js 的 fetch 請求被 [...slug].astro 攔截
解決：使用 is:inline 將所有客戶端代碼內聯到 HTML 中，避免額外請求
```

**實際代碼**：
```astro
<script is:inline define:vars={{ posts: JSON.stringify(postsData) }}>
  // FilterEngine、SortEngine、PostFilterManager 類定義
  // 初始化邏輯
</script>
```

---

## 核心類型

```typescript
// Post：統一的文章格式
interface Post {
  id: string;                          // problem_id 或 slug
  slug: string;                        // URL 路徑
  category: "leetcode" | "zerojudge";
  title: string;                       // 中文標題
  enTitle: string;                     // 英文標題
  tagsCN: string[];                    // 中文標籤
  tagEN: string[];                     // 英文標籤
  difficulty: string;                  // "easy" | "medium" | "hard"
  date: number;                        // 時間戳（毫秒）
  searchContent: string;               // 預處理的可搜尋文本（全小寫）
}

// FilterCriteria：篩選條件
interface FilterCriteria {
  tags: Set<string>;                   // 選中的標籤（中文）
  tagFilterLogic: "AND" | "OR";
  difficulty: string | "all";
  category: string | null;             // null = 顯示所有分類
  searchTerm: string;
}

// FilterResult：篩選結果
interface FilterResult {
  posts: Post[];
  count: number;
}

// SortConfig：排序配置
interface SortConfig {
  field: "id" | "date";
  order: "asc" | "desc";
}
```

---

## 單元測試

**測試框架**：Vitest

**測試文件**：
- `src/scripts/filterEngine.test.ts` - 14 個測試
- `src/scripts/sortEngine.test.ts` - 10 個測試

**測試覆蓋**：
- ✅ 分類、難度、標籤（AND/OR）、搜尋篩選
- ✅ 組合篩選（多條件同時生效）
- ✅ ID 排序（純數字和混合型）
- ✅ 日期排序
- ✅ 邊界情況（空陣列、單元素、穩定排序）

**執行測試**：
```bash
npm run test:run      # 執行一次
npm test              # 監聽模式
```

---

## 檔案結構

```
src/
├── scripts/
│   ├── filterEngine.ts      # 篩選邏輯（核心）
│   ├── filterEngine.test.ts # 篩選測試（14 個）
│   ├── sortEngine.ts        # 排序邏輯（核心）
│   ├── sortEngine.test.ts   # 排序測試（10 個）
│   ├── postFilter.ts        # 原始版本（參考用）
│   └── initFilter.ts        # 初始化代碼（已內聯）
├── pages/
│   ├── index.astro          # 首頁（內聯邏輯）
│   └── [...slug].astro      # 文章內頁
├── components/
│   └── PostRow.astro        # 純展示層
├── types.ts                 # 類型定義
└── ...
```

---

## 未來擴展

### 1. **PostSearchCoordinator**（推薦）
提取搜尋協調層，允許其他頁面複用篩選邏輯：
```typescript
class PostSearchCoordinator {
  filter(posts, criteria) { /* 調用 FilterEngine */ }
  sort(posts, config) { /* 調用 SortEngine */ }
  // 可在其他頁面複用（如標籤詳情頁）
}
```

### 2. **虛擬滾動優化**
若 Posts 數量增長到 1000+，可加入虛擬滾動以提升效能。

### 3. **進階搜尋**
- 正則表達式搜尋
- 語義搜尋（基於關鍵詞相似度）

### 4. **狀態持久化改進**
目前狀態儲存在 localStorage，未來可考慮：
- URL 參數完整化（所有篩選條件都在 URL 中）
- 允許分享篩選狀態（如「分享這個篩選結果」）

---

## 常見問題

### Q: 為什麼 FilterEngine/SortEngine 不直接修改 DOM？
**A**: 分離關注點。邏輯層不應知道 UI 層的存在，這樣可以：
- 獨立測試邏輯（單元測試）
- 複用邏輯到其他 UI 框架（如 React）
- 易於維護和修改

### Q: 為什麼使用 `Set<string>` 來表示標籤而不是 `string[]`？
**A**: 性能和語義。
- `Set` 的 `has()` 查詢是 O(1)，`Array.includes()` 是 O(n)
- `Set` 語義上表示「無序集合」，符合標籤的性質

### Q: 搜尋為什麼要轉換為小寫？
**A**: 提升用戶體驗。用戶搜尋 "Two Sum" 或 "two sum" 應該有相同結果。

### Q: 為什麼 ID 排序要特殊處理數字？
**A**: 解決字符排序的問題。
```
字符排序：  ['10', '2', '3']  → ['10', '2', '3'] ❌
數字排序：  ['10', '2', '3']  → ['2', '3', '10'] ✅
```

---

## 版本歷史

**v1.0** (2026-03-15)
- ✅ 架構重構：FilterEngine/SortEngine 分離
- ✅ 單元測試：24 個測試全覆蓋
- ✅ Bug 修復：搜尋不區分大小寫、FOUC 問題
- 📝 本文檔

---

**最後更新**：2026-06-09  
**維護者**：jjjghu
