// 讓 VS Code 與 npm run dev 的預覽網頁互相跟著切換（伺服器那一端見 src/plugins/beyond-preview-sync.mjs）：
// - 切換到 src/content/beyond/ 底下的 .md：通知伺服器，網頁跳到那一篇。
// - 網頁換到某一篇：伺服器把原稿路徑交給這裡，在左邊的編輯區打開（游標留在網頁上）。
// 沒開 npm run dev 時什麼都不做，每幾秒再試著連線。安裝方式見同資料夾的 README.md。
const vscode = require('vscode');

// ponytail: 固定 npm run dev 的預設埠；改了埠就改這裡
const SERVER = 'http://127.0.0.1:4321';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function activate(context) {
    // 「輸出」面板選「解題之外預覽」可以看到每一步，同步沒反應時用來查問題
    const log = vscode.window.createOutputChannel('解題之外預覽', { log: true });
    context.subscriptions.push(log);
    const notify = (editor) => {
        const file = editor?.document.uri.fsPath.replaceAll('\\', '/');
        if (!file || !/\/src\/content\/beyond\/.+\.md$/.test(file)) return;
        fetch(`${SERVER}/__beyond-show?file=${encodeURIComponent(file)}`).catch(() => {});
    };
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(notify));
    notify(vscode.window.activeTextEditor);

    let active = true;
    context.subscriptions.push({ dispose: () => (active = false) });
    (async () => {
        let connected = false;
        while (active) {
            try {
                const response = fetch(`${SERVER}/__beyond-wait`);
                if (!connected) log.info('已連上 npm run dev，等待網頁換頁');
                connected = true;
                const file = await (await response).text();
                if (!file) continue;
                log.info(`網頁換到 ${file}`);
                await vscode.window.showTextDocument(vscode.Uri.file(file), {
                    viewColumn: vscode.ViewColumn.One,
                    preserveFocus: true,
                    preview: false,
                });
            } catch (error) {
                if (connected) log.warn(`中斷：${error?.cause?.code ?? error?.message ?? error}`);
                connected = false;
                await sleep(3000);
            }
        }
    })();
}

module.exports = { activate };
