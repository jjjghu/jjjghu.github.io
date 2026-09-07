# 安全維護

本專案是發布到 GitHub Pages 的 Astro 靜態網站，沒有登入、資料庫或接收使用者資料的後端。安全檢查重點是瀏覽器注入、內容與主題的信任邊界、匯入工具、相依套件及部署流程。

## 信任邊界

- Markdown 在建置時先解析 HTML，再以 `rehype-sanitize` 清理，最後產生 KaTeX 與 Shiki 的可信 HTML。保留必要的文字樣式，移除脚本、事件屬性、框架與不安全連結。程式碼標題透過文字屬性傳遞。
- 文章 `link`／`en_link` 只接受不含帳密的完整 HTTP(S) 網址；空字串視為未提供。JSON 資料島與 JSON-LD 統一使用 `serializeJson`，防止 `</script>` 提前結束元素。
- 自訂主題名稱以 `textContent` 顯示。儲存內容每次讀取都驗證結構、識別碼、大小與 CSS；最多 20 個主題，每份 CSS 最多 100,000 字元。
- 自訂 CSS 可改變整頁外觀，因此仍只應使用自己理解的主題。CSS parser 拒絕資源 URL、外部匯入、字型來源、跳脫識別字等構造；這不是隔離任意 CSS 的沙箱。
- `storage` 共用模組處理儲存被禁止或額度不足的情況。失敗時設定只在本頁記憶體生效，新增主題時會提示無法持久保存。
- LeetCode 匯入固定連線官方 GraphQL 端點，禁止重新導向，限制 15 秒與 1 MB 回應；驗證資料後用 YAML serializer 輸出，驗證檔名與目錄，並以 `wx` 排他建立檔案。
- Git 中的設定檔、Astro 元件、建置腳本與 npm 套件仍屬可執行的可信程式碼。審查外部 PR 時不可提供敏感憑證，也不可將內容清理器視為任意專案程式碼的沙箱。

## 發布防護

`src/plugins/security-policy.mjs` 在完整建置結束後處理所有 HTML，包含 `public/theme-authoring.html`，置入 CSP。內嵌腳本以 SHA-256 精確授權，拒絕 inline event handler、外部脚本、外部 CSS、外部字型、框架、物件、表單提交及 base URL 改寫。KaTeX 與 Boxicons 從鎖定的 npm 套件產出本機資源。

為支援既有主題、程式碼高亮及動態布局，`style-src` 保留 `'unsafe-inline'`；`script-src` 不使用 `'unsafe-inline'` 或 `'unsafe-eval'`。開發伺服器不會經過建置後處理，請使用正式建置的 preview 驗證 CSP。修改 `dist` 內腳本後必須重新建置，否則雜湊會失效。

GitHub Pages 的 HTTP 回應標頭由平台控制。CSP meta 無法提供 `frame-ancestors`、HSTS 或 `X-Content-Type-Options`；若未來使用可設定標頭的主機，應在主機層加入 `frame-ancestors 'none'`、`X-Content-Type-Options: nosniff` 與適當的 HSTS 設定。

部署工作流只保留一份。PR 僅執行唯讀權限的驗證；部署權限限制在 main 分支的 deploy job，且必須先通過套件查核、單元測試、型別檢查、建置及瀏覽器測試。Actions 鎖定提交雜湊，Dependabot 每週檢查 npm 與 Actions 更新。

## 驗證方式

使用 Node.js 22.12 以上版本；CI 使用 Node.js 24。

```sh
npm ci
npm audit --audit-level=low
npm run test:run
npm run check
npm run build
npm run test:browser
```

本機瀏覽器測試使用已安裝的 Chrome；CI 使用 Playwright Chromium。測試涵蓋主題名稱 XSS、CSS 外連、毀損／禁止儲存、JSON-LD 邊界、Markdown 清理、YAML 跳脫、路徑穿越、禁止覆寫、文章路由、桌面與手機畫面的資源載入，以及正式輸出的 CSP 腳本阻擋。

2026-09-07 檢查時，原始 lockfile 的 npm audit 回報 13 項套件漏洞（11 high、2 moderate）。更新與修補後仍需定期重跑 audit；零通報只代表當下漏洞資料庫未命中，並不保證沒有未知漏洞。解題文章內的程式碼是教學內容，不會由網站執行，本次未逐題證明演算法的正確性。
