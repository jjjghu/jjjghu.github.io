// 查 Games.md 裡每款 Steam 遊戲「最早解鎖的成就」日期，當作第一次遊玩的時間。
// 家庭共享借來玩的遊戲，成就也記在自己的帳號上，所以一樣查得到。
//
// 用法：node scripts/first-played.mjs <個人檔案網址、自訂網址名稱或 17 位數 SteamID>
// 需要先在 Steam 的隱私設定把「我的個人檔案」與「遊戲詳細資料」設成公開，查完可以改回來。
// 結果印在終端機，也存一份到系統暫存資料夾（不在 repo 裡，不會被提交）。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesFile = path.join(root, 'src/content/beyond/長期紀錄/Games.md');
const cards = JSON.parse(fs.readFileSync(path.join(root, 'src/data/link-cards.json'), 'utf8'));
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (first-played lookup)' };
// 本機時區的日期（台灣是 UTC+8，用 UTC 會讓深夜解鎖的成就差一天）
const date = (game) => new Date(game.time * 1000).toLocaleDateString('sv-SE');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const input = process.argv[2];
if (!input) {
    console.error('用法：node scripts/first-played.mjs <Steam 個人檔案網址>');
    process.exit(1);
}
// 17 位數的 SteamID 一律走 /profiles/（就算網址寫成 /id/7656…）；其他的是自訂網址名稱，走 /id/
const steamId = input.match(/(?:^|\/)(\d{17})(?:\/|$)/)?.[1];
const profile = steamId
    ? `profiles/${steamId}`
    : (input.match(/steamcommunity\.com\/(id\/[^/?#]+)/)?.[1] ?? `id/${input}`);
const base = `https://steamcommunity.com/${profile}`;

const get = (url) =>
    fetch(url, {
        headers: HEADERS,
        redirect: 'manual',
        signal: AbortSignal.timeout(20000),
    });

// 個人檔案不公開時，成就頁一律是錯誤頁，先檢查省得白跑
const profileXml = await (await fetch(`${base}/?xml=1`, { headers: HEADERS })).text();
const problem = !profileXml.includes('<steamID64>')
    ? `找不到這個個人檔案：${base}`
    : !profileXml.includes('<privacyState>public</privacyState>')
      ? '個人檔案不是公開的：請到 Steam「編輯個人檔案 → 隱私設定」把個人檔案與遊戲詳細資料設成公開。'
      : '';

/** 最早的成就解鎖時間（秒），或查不到的原因 */
async function firstUnlock(appid) {
    let response = await get(`${base}/stats/${appid}/achievements/?xml=1&l=tchinese`);
    // Steam 會把數字 ID 轉址成遊戲代號（例如 /stats/TF2?tab=achievements），轉址時會掉 xml=1，要補回去
    if (response.status >= 300 && response.status < 400) {
        const next = new URL(response.headers.get('location'), base);
        next.searchParams.set('xml', '1');
        response = await get(next.href);
    }
    const body = await response.text();
    if (response.status === 429) return { reason: 'Steam 暫時拒絕（請求太快），稍後再跑一次' };
    if (!body.includes('<playerstats>')) {
        if (/<title>[^<]*Error/.test(body)) return { reason: '沒有成就，或遊戲詳細資料不公開' };
        // 遊戲在 Steam 上沒有成就時，會被轉回個人檔案頁（例如 Undertale）
        if (body.includes('<profile>')) return { reason: '這款遊戲在 Steam 上沒有成就' };
        return {
            reason: `看不懂的回應：${body.replace(/\s+/g, ' ').slice(0, 120)}`,
        };
    }
    const error = body.match(/<error><!\[CDATA\[(.*?)\]\]><\/error>/)?.[1];
    if (error) return { reason: error };
    const times = [...body.matchAll(/<unlockTimestamp>(\d+)<\/unlockTimestamp>/g)].map((match) => Number(match[1]));
    return times.length ? { time: Math.min(...times) } : { reason: '還沒解鎖任何成就' };
}

// 有網路連線還開著時呼叫 process.exit，Windows 上的 Node 會印出斷言錯誤，所以用 exitCode 讓程式自然結束
if (problem) {
    console.error(problem);
    process.exitCode = 1;
} else {
    await run();
}

async function run() {
    // Games.md 裡的遊戲依出現順序；Steam 以外的（例如 Minecraft）直接標成查不到
    const games = [];
    for (const line of fs.readFileSync(gamesFile, 'utf8').split('\n')) {
        const appid = line.match(/store\.steampowered\.com\/app\/(\d+)/)?.[1];
        const custom = Object.entries(cards).find(
            ([, card]) => card.url && line.includes(card.url.replace(/\/+$/, '')),
        );
        if (appid && !games.some((game) => game.appid === appid)) {
            games.push({
                appid,
                title: cards[`steam-${appid}`]?.title ?? `Steam ${appid}`,
            });
        } else if (custom && !games.some((game) => game.title === custom[1].title)) {
            games.push({ title: custom[1].title, reason: '不在 Steam 上' });
        }
    }

    for (const [index, game] of games.entries()) {
        if (!game.appid) continue;
        process.stdout.write(`(${index + 1}/${games.length}) ${game.title}…`);
        Object.assign(game, await firstUnlock(game.appid));
        console.log(game.time ? date(game) : game.reason);
        await sleep(1500); // 放慢速度，免得被 Steam 擋
    }

    const dated = games.filter((game) => game.time).sort((a, b) => a.time - b.time);
    const unknown = games.filter((game) => !game.time);
    console.log('\n依第一次遊玩排序：');
    for (const game of dated) console.log(`${date(game)}  ${game.title}`);
    for (const game of unknown) console.log(`查不到      ${game.title}（${game.reason}）`);

    const output = path.join(os.tmpdir(), 'first-played.json');
    fs.writeFileSync(
        output,
        JSON.stringify(
            [...dated, ...unknown].map(({ appid, title, time, reason }) => ({
                appid,
                title,
                first: time ? date({ time }) : null,
                reason,
            })),
            null,
            2,
        ),
    );
    console.log(`\n結果也存在 ${output}`);
}
