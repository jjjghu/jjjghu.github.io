# CSS 重構方案說明（修正版）

## 問題

之前的方案有個問題：直接複製貼上代碼到各個 CSS 檔案，這樣還是有重複，無法真正共用。

## ✅ 正確的方案：組合方式（Composition）

不在 CSS 中複製代碼，而是**在 HTML/Astro 中使用多個 class 的組合**。

### 三層結構

#### Layer 1: **Utilities.css**（淺層）
```css
.flex-center { display: flex; align-items: center; }
.gap-xs { gap: 6px; }
.gap-sm { gap: 12px; }
.transition-fast { transition: all 0.2s ease; }
.text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
```

#### Layer 2: **Component-base.css**（深層基礎）
```css
.interactive-container {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--interactive-py, 6px) var(--interactive-px, 12px);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  background-color: var(--interactive-bg, var(--color-canvas-subtle));
  color: var(--interactive-fg, var(--color-fg-default));
}

.interactive-container.sm {
  --interactive-py: 2px;
  --interactive-px: 8px;
  font-size: 0.75rem;
}

.interactive-container.md {
  --interactive-py: 6px;
  --interactive-px: 12px;
  font-size: 0.9rem;
}

.interactive-container.rounded {
  border-radius: 999px;
}
```

#### Layer 3: **各模塊的特定樣式**（color、hover 等）
```css
/* badges.css - 只定義 Badge 特有的部分 */
.difficulty-badge {
  --badge-color: var(--diff-gray);
  --interactive-fg: var(--badge-color);
  --interactive-bg: color-mix(in srgb, var(--badge-color) 10%, transparent);
  transition: all 0.2s ease;
  font-family: ui-monospace, monospace;
  font-weight: 500;
}

.difficulty-badge:hover {
  background-color: color-mix(in srgb, var(--badge-color) 20%, transparent);
  border-color: color-mix(in srgb, var(--badge-color) 40%, transparent);
}

/* dropdown.css - 只定義 Dropdown 特有的部分 */
.dropdown-btn {
  min-width: 140px;
  transition: all 0.2s;
}

.dropdown-btn:hover {
  background-color: var(--color-border-default);
}
```

### 在 HTML/Astro 中使用組合

```html
<!-- Badge: 組合多個 class -->
<span class="interactive-container sm rounded difficulty-badge diff-easy">
  Easy
</span>

<!-- Dropdown Button: 組合多個 class -->
<button class="interactive-container md dropdown-btn">
  排序方式 ▼
</button>

<!-- Title Container: 使用 utilities 組合 -->
<div class="flex-center gap-sm">
  <span>📄</span>
  <a class="post-link">題目名稱</a>
</div>

<!-- Tags Wrapper: 組合 utilities -->
<div class="flex-center gap-xs">
  <span class="interactive-container sm rounded difficulty-badge diff-0">標籤1</span>
  <span class="interactive-container sm rounded difficulty-badge diff-0">標籤2</span>
</div>
```

## 🎯 核心優勢

| 方面 | 舊方案 | 新方案 |
|------|--------|--------|
| **CSS 重複** | 每個模塊都複製基礎代碼 | ❌ 沒有重複 |
| **維護點** | 多個檔案中的基礎樣式 | ✅ 只在一個地方（component-base.css） |
| **彈性空間** | 各模塊有自己的 hover/色彩邏輯 | ✅ 保留彈性 |
| **HTML 複雜度** | 較簡單（每個元素一個 class） | 每個元素多個 class（透明） |

## 📝 在 Astro 組件中的使用

```astro
---
// Badge.astro
export interface Props {
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
}

const { difficulty, text } = Astro.props;
---

<span class="interactive-container sm rounded difficulty-badge diff-{difficulty}">
  {text}
</span>
```

```astro
---
// Dropdown.astro
export interface Props {
  label: string;
  options: string[];
}

const { label, options } = Astro.props;
---

<div class="dropdown-container">
  <button class="interactive-container md dropdown-btn">
    {label} ▼
  </button>
  <div class="dropdown-menu">
    {options.map(opt => (
      <div class="dropdown-option">{opt}</div>
    ))}
  </div>
</div>
```

## ✅ 重構檢查清單

- [ ] **utilities.css** - 包含淺層、可複用的工具類
  - Flexbox 工具類
  - Spacing 工具類
  - Transition 工具類
  - Text 工具類
  
- [ ] **component-base.css** - 包含互動容器的共同基礎
  - `.interactive-container` 基礎樣式
  - `.sm`, `.md`, `.lg` 大小變體
  - `.rounded` 圓形變體

- [ ] **各模塊 CSS** - 只包含自己特有的樣式
  - Badge: 顏色邏輯、font、hover 效果
  - Dropdown: 寬度、hover、active 狀態
  - Post-List: Grid 邏輯、hover 效果

- [ ] **HTML/Astro** - 使用多個 class 組合
  - Badge: `class="interactive-container sm rounded difficulty-badge diff-easy"`
  - Dropdown Button: `class="interactive-container md dropdown-btn"`
  - Title Container: `class="flex-center gap-sm"`

## 🚀 優勢總結

✅ **CSS 無重複** — 真正的代碼複用  
✅ **深層模塊** — component-base.css 提供豐富的介面，隱藏複雜的變數管理  
✅ **局部性高** — 需要改某個樣式，只需修改一個檔案  
✅ **彈性保留** — 各模塊可以自由定義自己的 hover、顏色等  
✅ **易於維護** — HTML 中的多個 class 可以在 Astro 組件中透明地管理  

---

**這個方案才是真正的「共用」，既沒有代碼重複，又保留了足夠的變化空間。**
