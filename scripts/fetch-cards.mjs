// 下載「解題之外」連結卡片的標題與縮圖，存進 src/data/link-cards.json 和 public/cards/。
// 用法：node scripts/fetch-cards.mjs                 掃描已發布的文章（src/content/beyond/ 與其中的 長期紀錄/）
//       node scripts/fetch-cards.mjs <檔案> [...]     只掃描指定的檔案，例如 drafts 裡正在寫的那篇
// 已經抓過的連結會跳過；想重抓就刪掉 JSON 裡那一筆和 public/cards/ 裡那張圖。
// bilibili 會擋自動抓取：抓不到時標題用連結文字（[標題](網址)），封面可以手動存成 public/cards/bilibili-BV….jpg。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cardOf, IMAGE_TYPES } from '../src/plugins/remark-link-card.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const beyondDir = path.join(root, 'src/content/beyond');
const cardsFile = path.join(root, 'src/data/link-cards.json');
const imageDir = path.join(root, 'public/cards');
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (link-card fetcher)' };

// 和外掛的條件一致：一行只有一個連結（裸網址、<網址> 或 [文字](網址)）
const LINK_LINE = /^\s*(?:\[[^\]]*\]\((\S+?)\)|<?(https?:\/\/[^\s>]+)>?)\s*$/;

const get = async (url) => {
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response;
};

const FETCHERS = {
    async youtube(id) {
        const url = `https://www.youtube.com/watch?v=${id}`;
        const data = await (await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`)).json();
        return { title: data.title, author: data.author_name, image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
    },
    async bilibili(id) {
        const { code, data } = await (await get(`https://api.bilibili.com/x/web-interface/view?bvid=${id}`)).json();
        if (code !== 0) throw new Error(`bilibili 回應 ${code}`);
        return { title: data.title, author: data.owner?.name, image: data.pic.replace(/^http:/, 'https:') };
    },
    async steam(id) {
        const json = await (await get(`https://store.steampowered.com/api/appdetails?appids=${id}&l=tchinese&filters=basic`)).json();
        const data = json[id]?.data;
        if (!data) throw new Error('Steam 查無此遊戲');
        return { title: data.name, description: data.short_description, image: data.header_image };
    },
};

const files = process.argv.length > 2
    ? process.argv.slice(2)
    : ['', '長期紀錄'].flatMap((folder) => {
          const dir = path.join(beyondDir, folder);
          return fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith('.md')).map((name) => path.join(dir, name)) : [];
      });

const found = new Map();
for (const file of files) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const match = line.match(LINK_LINE);
        const card = match && cardOf(match[1] ?? match[2]);
        if (card) found.set(card.key, card);
    }
}

const cards = fs.existsSync(cardsFile) ? JSON.parse(fs.readFileSync(cardsFile, 'utf8')) : {};
const before = Object.keys(cards).length;
fs.mkdirSync(imageDir, { recursive: true });
for (const { platform, id, key } of found.values()) {
    if (cards[key]) continue;
    try {
        const { image, ...info } = await FETCHERS[platform](id);
        const type = IMAGE_TYPES.find((ext) => new URL(image).pathname.endsWith(`.${ext}`)) ?? 'jpg';
        fs.writeFileSync(path.join(imageDir, `${key}.${type}`), Buffer.from(await (await get(image)).arrayBuffer()));
        cards[key] = info;
        console.log(`✓ ${key}：${info.title}`);
    } catch (error) {
        console.warn(`✗ ${key}：${error.message}（卡片仍會顯示，只是沒有縮圖）`);
    }
}

const sorted = Object.fromEntries(Object.entries(cards).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(cardsFile, `${JSON.stringify(sorted, null, 2)}\n`);

// Astro 依文章內容快取渲染結果（重啟也會沿用），文章沒改、只有卡片資料變了時不會重新渲染。
// 抓到新資料就清掉本機快取（兩個檔都不進 git，GitHub 上的建置本來就從零開始）。
const fetched = Object.keys(cards).length > before;
if (fetched) {
    for (const store of ['.astro/data-store.json', 'node_modules/.astro/data-store.json']) {
        fs.rmSync(path.join(root, store), { force: true });
    }
    console.log('已清除 Astro 的內容快取：開發伺服器請重啟一次 npm run dev 才會看到新卡片。');
}
