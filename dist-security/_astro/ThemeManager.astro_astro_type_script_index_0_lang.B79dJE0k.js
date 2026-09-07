import{a as e,i as t,n,r,t as i}from"./themeRuntime.BEAL2ZBg.js";import{t as a}from"./settingsManager.Pir9GbVy.js";import{n as o}from"./constants.vIqzkD2m.js";var s=a();s.register({key:o.customThemes,type:`text`,defaultValue:JSON.stringify([]),onApply:()=>u()}),s.register({key:o.activeThemeId,type:`text`,defaultValue:t,onApply:()=>u()});function c(){return n(s.get(o.customThemes))}function l(){return s.get(o.activeThemeId)||`dark`}function u(){let n=document.getElementById(`all-themes-list`),r=l(),a=c(),u=[...e.map(e=>({...e,source:`official`})),...a.map(e=>({...e,source:`custom`}))];n.replaceChildren(...u.map(e=>{let t=r===e.id,n=document.createElement(`div`);n.className=`theme-card ${t?`is-active`:``}`,n.dataset.id=e.id,n.dataset.source=e.source,n.setAttribute(`role`,`radio`),n.setAttribute(`aria-checked`,String(t)),n.tabIndex=0;let i=document.createElement(`div`);i.className=`radio-dot ${t?`is-checked`:``}`;let a=document.createElement(`div`);a.className=`theme-card-info`;let o=document.createElement(`div`);o.className=`theme-card-name`,o.textContent=e.name;let s=document.createElement(`div`);if(s.className=`theme-card-badge`,s.textContent=e.source===`official`?`官方`:`自訂`,a.append(o,s),n.append(i,a),e.source===`custom`){let t=document.createElement(`button`);t.className=`theme-delete-btn`,t.dataset.id=e.id,t.title=`刪除`,t.setAttribute(`aria-label`,`刪除 ${e.name}`);let r=document.createElement(`i`);r.className=`bx bx-trash`,t.append(r),n.append(t)}return n.addEventListener(`keydown`,e=>{e.target===n&&(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),n.click())}),n})),n.querySelectorAll(`.theme-card`).forEach(e=>{e.addEventListener(`click`,t=>{if(t.target.closest(`.theme-delete-btn`))return;let n=e.dataset.id;s.set(o.activeThemeId,n),i(n)})}),n.querySelectorAll(`.theme-delete-btn`).forEach(e=>{e.addEventListener(`click`,n=>{n.stopPropagation();let r=e.dataset.id;if(!confirm(`確定要刪除這個主題嗎？`))return;let a=c().filter(e=>e.id!==r);s.set(o.customThemes,JSON.stringify(a)),l()===r&&(s.set(o.activeThemeId,t),i(t))})})}var d=`/* ================================================================
   自訂主題模板
   ----------------------------------------------------------------
   給 AI 的說明：這是一個網站的完整主題色彩變數表。請根據我描述的風格，
   把下列每一個變數都填上恰當的顏色值（rgb()、hex 或 hsl 皆可），
   維持良好的對比與可讀性，並直接回傳整段可貼回的 CSS。
   ================================================================ */
:root {
  /* ── 背景（由深到淺）───────────────────────────── */
  --color-page-bg:        rgb(13, 17, 23);   /* 整個頁面的最底層背景 */
  --color-canvas-default: rgb(13, 17, 23);   /* 主要內容區背景 */
  --color-canvas-subtle:  rgb(22, 27, 34);   /* 程式碼區塊、輸入框背景 */
  --color-canvas-overlay: rgb(33, 38, 45);   /* 下拉選單、彈窗背景（最上層）*/
  --color-card-bg:        rgb(22, 27, 34);   /* 文章卡片背景 */

  /* ── 邊框與分隔線 ─────────────────────────────── */
  --color-border-default: rgb(48, 54, 61);   /* 一般邊框（卡片、按鈕）*/
  --color-border-muted:   rgb(33, 38, 45);   /* 次要邊框、標題下分隔線 */
  --color-neutral-muted:  rgba(35, 43, 53, 0.2); /* 行內程式碼背景 */
  --color-border-neutral: rgb(65, 73, 82);   /* 行內程式碼邊框 */

  /* ── 文字 ─────────────────────────────────────── */
  --color-fg-default: rgb(201, 209, 217);    /* 主要文字 */
  --color-fg-muted:   rgb(139, 148, 158);    /* 次要文字、說明 */
  --color-accent-fg:  rgb(112, 160, 255);    /* 連結、強調色、focus 高亮 */

  /* ── 難度標籤色（題目列表用）───────────────────── */
  --diff-gray:   #9ca3af;
  --diff-red:    #f87171;
  --diff-orange: #fb923c;
  --diff-yellow: #facc15;
  --diff-green:  #4ade80;
  --diff-blue:   #60a5fa;
  --diff-purple: #c084fc;
  --diff-black:  #e2e8f0;

  /* ── LeetCode 官方難度色 ──────────────────────── */
  --leetcode-easy:   #00B8A3;
  --leetcode-medium: #FFC01E;
  --leetcode-hard:   #FF375F;

  /* ── 背景不透明度（100% = 完全不透明，可調低做半透明玻璃感）── */
  --bg-overlay-alpha: 100%;
}`;document.getElementById(`load-template-btn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`theme-css`);(!e.value.trim()||confirm(`目前已有內容，確定要覆蓋嗎？`))&&(e.value=d,e.focus())}),document.getElementById(`add-theme-btn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`theme-name`).value.trim(),t=document.getElementById(`theme-tags`).value.trim(),n=document.getElementById(`theme-css`).value.trim();if(!e||!n){alert(`請輸入主題名稱和 CSS 代碼`);return}let i=t?t.split(`,`).map(e=>e.trim()).filter(Boolean):[],a=c();if(e.length>100||i.length>20||i.some(e=>e.length>50)||a.length>=20){alert(`主題最多 20 個；名稱限 100 字，標籤最多 20 個且每個限 50 字。`);return}if(!r(n)){alert(`CSS 格式無效或超過 100 KB；主題不能包含外部資源、@import、url() 或跳脫字元。`);return}if(a.push({id:`custom-${crypto.randomUUID()}`,name:e,tags:i,css:n}),!s.set(o.customThemes,JSON.stringify(a))){alert(`瀏覽器無法儲存主題，目前僅在本頁生效。`);return}document.getElementById(`theme-name`).value=``,document.getElementById(`theme-tags`).value=``,document.getElementById(`theme-css`).value=``});