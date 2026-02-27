---
title: "安裝 ScriptCat (腳本貓) 與同步腳本"
---

這份教學將引導你在瀏覽器中安裝 ScriptCat 以及本網站專用的自動同步腳本。

## 1. 安裝 ScriptCat 擴充功能

**ScriptCat (腳本貓)** 是一個開源的瀏覽器擴充功能，\
用來執行使用者腳本(UserScript)。支持 Chrome, Edge, Firefox 等主流瀏覽器。

- [Chrome / Edge 安裝連結](https://chrome.google.com/webstore/detail/scriptcat/aefkmifgmaafnojlojpnekndnbfjfhd)
- [Firefox 安裝連結](https://addons.mozilla.org/zh-TW/firefox/addon/scriptcat/)
- [ScriptCat 官方文件](https://docs.scriptcat.org/)

## 2. 建立新腳本
擴充功能安裝完畢後，點擊瀏覽器右上角的 ScriptCat 圖示，\
然後點選 **添加腳本** (或進入後台點右上角的加號新建腳本)。

## 3. 貼上同步腳本程式碼
複製下面的程式碼，貼到 ScriptCat 中，存檔。\
當腳本執行後，首先得在 LeetCode 登入自己的帳號，腳本會自動監聽您在 LeetCode 的解題進度，\
隨後回到這裡的首頁刷新網頁，題單上面就會把解過的題打勾了。

這個網站不只有 LeetCode 的題目，因此不會自動同步其他網站的解題狀態，
而是得自己打勾。

如果想自己修改功能，就改這份檔案就好了。

本檔案修改自[LeetCodeRating｜显示力扣周赛难度分](https://scriptcat.org/zh-CN/script-show-page/2778)\
同樣在這裡推薦使用。
```javascript
// ==UserScript==
// @name         LeetCode - jjjghu Sync (Full Icon Replace + Manual Toggle)
// @namespace    https://github.com/
// @version      1.6.1
// @description  修正圖示重複堆疊問題，支援全站圖示取代與手動點擊
// @author       jjjghu
// @run-at       document-end
// @match        *://*leetcode.cn/*
// @match        *://jjjghu.github.io/*
// @match        *://localhost:*/*
// @match        *://127.0.0.1:*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @require      https://unpkg.com/jquery@3.5.1/dist/jquery.min.js
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    // 取得資料
    let pbstatus = JSON.parse(GM_getValue('pbstatus', '{}').toString());
    let manualStatus = JSON.parse(GM_getValue('manual_pbstatus', '{}').toString());

    // --- 1. LeetCode 進度攔截 ---
    if (window.location.hostname.includes('leetcode.cn')) {
        const dummySend = XMLHttpRequest.prototype.send;
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
            this._url = url;
            originalOpen.call(this, method, url, async, user, password);
        };
        XMLHttpRequest.prototype.send = function (body) {
            this.addEventListener('load', function () {
                try {
                    if (this._url && this._url.includes('/graphql')) {
                        let res = JSON.parse(this.responseText);
                        if (res?.data?.problemsetQuestionListV2?.questions) {
                            res.data.problemsetQuestionListV2.questions.forEach(q => {
                                if (q.status) pbstatus[q.titleSlug] = { status: q.status };
                            });
                            GM_setValue('pbstatus', JSON.stringify(pbstatus));
                        }
                    }
                } catch (e) {}
            });
            dummySend.call(this, body);
        };
        return;
    }

    // --- 2. 樣式與圖示定義 ---
    GM_addStyle(`
        .is-roadmap-page .article-body ul { list-style: none !important; padding-left: 5px !important; }
        .is-roadmap-page .article-body ul li { display: flex; align-items: center; margin-bottom: 6px; }
        .roadmap-item-icon, .grid-item-icon { display: inline-flex; margin-right: 5px; width: 20px; justify-content: center; flex-shrink: 0; cursor: pointer; }
        
        .lc-icon-check { color: var(--color-accent-fg); width: 18px; height: 18px; transition: transform 0.1s; }
        .lc-icon-manual { color: var(--color-accent-fg); opacity: 0.7; } /* 手動勾選稍微透明以示區別 */
        .lc-icon-circle { color: var(--color-fg-muted, #848d97); width: 18px; height: 18px; opacity: 0.4; }
        
        .roadmap-item-icon:hover .lc-icon-check, .grid-item-icon:hover .lc-icon-check { transform: scale(1.1); }
        .roadmap-item-icon:hover .lc-icon-circle, .grid-item-icon:hover .lc-icon-circle { opacity: 0.8; }
    `);

    const checkmarkSVG = `<svg class="lc-icon-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    const circleSVG = `<svg class="lc-icon-circle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;

    // --- 3. 核心邏輯 ---

    function getIconHTML(slug) {
        const isAutoSolved = (pbstatus[slug]?.status === 'SOLVED' || pbstatus[slug]?.status === 'AC' || pbstatus[slug]?.status === 'ac');
        const isManualSolved = manualStatus[slug] === true;

        if (isAutoSolved) return checkmarkSVG;
        if (isManualSolved) return checkmarkSVG.replace('lc-icon-check', 'lc-icon-check lc-icon-manual');
        return circleSVG;
    }

    function toggleManualStatus(slug) {
        const isAutoSolved = (pbstatus[slug]?.status === 'SOLVED' || pbstatus[slug]?.status === 'AC' || pbstatus[slug]?.status === 'ac');
        if (isAutoSolved) return;

        manualStatus[slug] = !manualStatus[slug];
        GM_setValue('manual_pbstatus', JSON.stringify(manualStatus));

        // 核心修正：直接尋找所有標有該 slug 的圖示容器進行更新，不移除處理標記
        document.querySelectorAll(`[data-lc-slug="${slug}"]`).forEach(el => {
            el.innerHTML = getIconHTML(slug);
        });
    }

    function applyLeetCodeProgress() {
        const isRoadmapPath = window.location.pathname.includes('/roadmap');
        if (isRoadmapPath) document.body.classList.add('is-roadmap-page');

        // --- A. 主頁列表處理 ---
        document.querySelectorAll('.post-list-grid.file-row:not(.lc-processed)').forEach(row => {
            const link = row.querySelector('.post-link');
            if (!link) return;

            const slug = link.getAttribute('href')?.replace(/\//g, '').toLowerCase().trim();
            const fileIcon = row.querySelector('.file-icon');
            
            if (fileIcon) {
                row.classList.add('lc-processed');
                const newIconContainer = document.createElement('span');
                newIconContainer.className = 'grid-item-icon';
                newIconContainer.setAttribute('data-lc-slug', slug); // 標記 slug 方便局部更新
                newIconContainer.innerHTML = getIconHTML(slug);

                newIconContainer.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    toggleManualStatus(slug);
                };
                fileIcon.parentNode.replaceChild(newIconContainer, fileIcon);
            }
        });

        // --- B. Roadmap 頁面處理 ---
        if (isRoadmapPath) {
            document.querySelectorAll('.article-body ul li:not(.lc-rm-processed)').forEach(li => {
                const link = li.querySelector('a');
                if (!link) return;

                li.classList.add('lc-rm-processed');
                const slug = link.getAttribute('href')?.replace(/\//g, '').toLowerCase().trim();

                const iconSpan = document.createElement('span');
                iconSpan.className = 'roadmap-item-icon';
                iconSpan.setAttribute('data-lc-slug', slug);
                iconSpan.innerHTML = getIconHTML(slug);

                iconSpan.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleManualStatus(slug);
                };
                li.insertBefore(iconSpan, li.firstChild);
            });
        }
    }

    // 監控同步：如果其他分頁改了狀態，這裡也要跟著變
    setInterval(() => {
        manualStatus = JSON.parse(GM_getValue('manual_pbstatus', '{}').toString());
        // 更新畫面上所有圖示
        document.querySelectorAll('[data-lc-slug]').forEach(el => {
            const slug = el.getAttribute('data-lc-slug');
            const targetHTML = getIconHTML(slug);
            if (el.innerHTML !== targetHTML) {
                el.innerHTML = targetHTML;
            }
        });
        applyLeetCodeProgress();
    }, 1000);
})();
```