// 只在 npm run dev 有作用，讓 VS Code 與預覽網頁互相跟著切換（另一端是 tools/beyond-preview/ 的擴充功能與 BeyondLayout.astro）：
// - 編輯器 → 網頁：存檔，或在 VS Code 切換到「解題之外」的 .md（擴充功能呼叫 /__beyond-show），網頁跳到那一篇。
// - 網頁 → 編輯器：網頁換到某一篇時呼叫 /__beyond-page，等在 /__beyond-wait 的擴充功能收到路徑後打開原稿。
// 網址就是 /beyond/<檔名>/（content.config.ts 的 generateId），長期紀錄/ 與 drafts/ 也一樣。
import path from 'node:path';

const BEYOND_FILE = /\/src\/content\/beyond\/(?:.+\/)?([^/]+)\.md$/;
const query = (req, name) => new URL(req.url, 'http://localhost').searchParams.get(name) ?? '';

export default function beyondPreviewSync() {
    return {
        name: 'beyond-preview-sync',
        apply: 'serve',
        configureServer(server) {
            const notify = (file) => {
                const slug = file.replaceAll('\\', '/').match(BEYOND_FILE)?.[1];
                if (slug) server.ws.send({ type: 'custom', event: 'beyond:edit', data: { slug } });
            };
            server.watcher.on('change', notify);
            server.watcher.on('add', notify);
            server.middlewares.use('/__beyond-show', (req, res) => {
                notify(query(req, 'file'));
                res.end();
            });

            let waiting = [];
            const status = { lastPage: null };
            server.middlewares.use('/__beyond-page', (req, res) => {
                const file = path.resolve(server.config.root, query(req, 'file'));
                status.lastPage = { at: new Date().toLocaleTimeString('sv-SE'), file, handedTo: waiting.length };
                if (BEYOND_FILE.test(file.replaceAll('\\', '/'))) waiting.forEach((wait) => wait.end(file));
                waiting = [];
                res.end();
            });
            // 同步沒反應時用來查問題：有沒有擴充功能在等、網頁最近一次有沒有通知
            server.middlewares.use('/__beyond-status', (req, res) => {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ waiting: waiting.length, ...status }));
            });
            server.middlewares.use('/__beyond-wait', (req, res) => {
                waiting.push(res);
                // 太久沒換頁就回空的，讓擴充功能重新等，不讓連線一直掛著
                const timer = setTimeout(() => res.end(), 50_000);
                req.on('close', () => {
                    clearTimeout(timer);
                    waiting = waiting.filter((wait) => wait !== res);
                });
            });
        },
    };
}
