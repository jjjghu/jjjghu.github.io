# CSS 重構 Demo

這個資料夾展示了 CSS 重構方案，包含候選 2（utilities.css）和候選 3（component-base.css）的具體實現。

## 📂 文件結構

```
zdemo/
├── styles/
│   ├── utilities.css              # 可組合的工具類
│   ├── component-base.css         # 互動容器基礎樣式
│   ├── badges-refactored.css      # 重構後的 Badge
│   ├── dropdown-refactored.css    # 重構後的 Dropdown
│   └── post-list-refactored.css   # 重構後的 Post-List
├── demo.html                       # 互動演示頁面
└── README.md                       # 本檔案
```

## 🎯 設計原則

### Utilities.css（淺層但實用）
包含可組合的工具類，供多個模塊使用：
- **Flexbox 工具類**: `.flex-center`, `.flex-between`
- **Spacing 工具類**: `.gap-xs`, `.gap-sm`, `.gap-md`
- **Transition 工具類**: `.transition-fast`, `.transition-colors`
- **Text 工具類**: `.text-truncate`, `.text-wrap`

**特點**：
- 天生淺層（工具類就是這樣）
- 但讓其他模塊更深（減少重複）
- 易於擴展新工具類

### Component-base.css（深層基礎）
定義所有互動容器的共同「靜態」部分：
- `display: flex` + `align-items: center`
- `padding`, `border`, `border-radius`
- 基礎背景和邊框顏色
- 基礎 transition（只有 `border-color`）

**特點**：
- 深度較高：提供豐富的介面（多種大小變體），隱藏複雜的 CSS 變數管理
- **不包含** hover 行為、color-mix 邏輯
- 各模塊在此基礎上添加自己的特性

## 🔄 重構後的模塊

### Badge（使用 component-base）
```css
.difficulty-badge {
  @extend .interactive-container;      /* 繼承基礎 */
  @extend .interactive-container.rounded; /* 圓形變體 */
  
  --badge-color: ...;                   /* 自己的顏色 */
  --interactive-fg: var(--badge-color);
  --interactive-bg: color-mix(...);     /* 自己的 color-mix 邏輯 */
}

.difficulty-badge:hover {
  background-color: color-mix(...);     /* 自己的 hover 效果 */
  border-color: color-mix(...);
}
```

**好處**：
- 消除了重複的 `padding`, `border-radius`, `display: flex` 等
- 保留顏色邏輯和 hover 效果的彈性

### Dropdown（使用 component-base）
```css
.dropdown-btn {
  @extend .interactive-container;       /* 繼承基礎 */
  @extend .interactive-container.md;    /* 中型大小變體 */
  
  /* Dropdown button 自己的邏輯 */
  min-width: 140px;
}

.dropdown-btn:hover {
  background-color: var(--color-border-default); /* 自己的 hover */
}
```

**好處**：
- 消除重複的基礎樣式
- 各自實現 hover 和 active 狀態

### Post-List（使用 utilities）
```html
<div class="title-container">
  <span>📄</span>
  <a class="post-link">
    <span class="title-text">兩數之和</span>
  </a>
</div>
```

```css
.title-container {
  @extend .flex-center;    /* 使用工具類 */
  @extend .gap-sm;         /* 使用工具類 */
  min-width: 0;
}

.post-link {
  @extend .transition-colors; /* 使用工具類 */
}
```

**好處**：
- 消除重複的 `display: flex; align-items: center;` 定義
- 使用工具類使代碼更簡潔

## 📊 代碼重複情況對比

### 重構前
```
badges.css:      display: inline-flex; align-items: center; gap: 6px;
dropdown.css:    display: flex; align-items: center; gap: 6px;
post-list.css:   display: flex; align-items: center; gap: 12px;
                 (出現 3 次) ❌
```

### 重構後
```
utilities.css:   .flex-center { display: flex; align-items: center; }
                 .gap-xs { gap: 6px; }
                 (只在一個地方定義) ✅

badges.css:      @extend .flex-center; @extend .gap-xs;
dropdown.css:    @extend .flex-center; @extend .gap-xs;
post-list.css:   @extend .flex-center; @extend .gap-sm;
                 (使用工具類，代碼更簡潔) ✅
```

## 🧪 如何測試

1. 在瀏覽器中打開 `demo.html`
2. 查看：
   - Badge 的懸停效果（顏色變深）
   - Dropdown 的互動狀態
   - Post-List 的行懸停效果
3. 檢查代碼：所有 CSS 檔案都在 `styles/` 資料夾中

## 🎨 關鍵改進

| 方面 | 重構前 | 重構後 |
|------|--------|--------|
| **Flex 重複** | 3+ 個地方 | 1 個地方（utilities.css） |
| **Spacing 變數** | 多種命名 | 統一的 gap-xs/sm/md |
| **Component 基礎** | 分散定義 | 集中在 component-base.css |
| **Hover 效果** | 各自實現 | 各自實現（保留彈性） |
| **維護點** | 多個檔案 | 減少至 3 個核心模塊 |

## ✅ 驗收標準

重構成功的標記：
- ✅ utilities.css 提供可組合的工具類
- ✅ component-base.css 定義互動容器的共同部分
- ✅ 各模塊（badge、dropdown、post-list）仍保留自己的特色
- ✅ 沒有過度的變數命名規範（保留變化空間）
- ✅ 代碼行數減少，重複降低

## 🚀 下一步

若要套用到實際項目：
1. 複製 `styles/` 資料夾到 `src/styles/`
2. 更新現有的 CSS 檔案以使用新結構
3. 在 `Layout.astro` 中調整導入順序：
   ```astro
   import "../styles/global.css";
   import "../styles/utilities.css";
   import "../styles/component-base.css";
   import "../styles/badges.css";
   import "../styles/dropdown.css";
   import "../styles/post-list.css";
   ```
4. 測試所有 UI 元件確保沒有視覺迴歸

---

**Created**: 2026-06-09  
**Purpose**: CSS 架構重構 Demo，驗證候選 2 + 3 方案
