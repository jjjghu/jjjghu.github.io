// 「解題之外」裡單獨成一段的 YouTube、bilibili、Steam 連結，渲染成有縮圖的卡片。
// 標題與縮圖由 scripts/fetch-cards.mjs 事先下載進 repo（src/data/link-cards.json、public/cards/），
// 網站本身不向外部讀圖（CSP 只允許本站圖片），所以不會有圖跑不出來的問題。
// 沒抓到資料時仍是卡片，只是沒有縮圖、標題改用連結文字。
//
// 卡片下一行沒有空行、直接接著寫的區塊帶 class="card-follow"，長期紀錄頁用它縮小和卡片的間距。
// 每張卡片的標題與錨點記在 remarkPluginFrontmatter.cards，長期紀錄頁用它產生跳轉清單。
import fs from 'node:fs';

const CARDS_FILE = new URL('../data/link-cards.json', import.meta.url);
const IMAGE_DIR = new URL('../../public/cards/', import.meta.url);
export const IMAGE_TYPES = ['jpg', 'png', 'webp'];
// rehype-sanitize 會替 id 加上這個前綴（防止覆蓋全域變數），錨點要用加過前綴的
const ID_PREFIX = 'user-content-';

const PLATFORMS = {
    youtube: { label: 'YouTube', noun: '影片', pattern: /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/ },
    bilibili: { label: 'bilibili', noun: '影片', pattern: /^https?:\/\/(?:www\.|m\.)?bilibili\.com\/video\/(BV[0-9A-Za-z]{10})/ },
    steam: { label: 'Steam', noun: '遊戲', pattern: /^https?:\/\/store\.steampowered\.com\/app\/(\d+)/ },
};

/**
 * 網址對應的卡片，例如 { platform: 'steam', id: '413150', key: 'steam-413150' }；不支援的網址回傳 null。
 * 三個平台以外的網址（例如 Minecraft 官網）要在 link-cards.json 手動登記：
 * "minecraft": { "url": "https://www.minecraft.net/zh-hant", "title": "…", "label": "…", "description": "…" }，
 * 圖片放 public/cards/minecraft.jpg。
 */
export function cardOf(url, cards = {}) {
    for (const [platform, { pattern }] of Object.entries(PLATFORMS)) {
        const id = url.match(pattern)?.[1];
        if (id) return { platform, id, key: `${platform}-${id}` };
    }
    const trim = (value) => value.replace(/\/+$/, '');
    const key = Object.keys(cards).find((name) => cards[name].url && trim(cards[name].url) === trim(url));
    return key ? { platform: 'custom', id: key, key } : null;
}

const readCards = () => (fs.existsSync(CARDS_FILE) ? JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8')) : {});
const imageOf = (key) => IMAGE_TYPES.map((type) => `${key}.${type}`).find((name) => fs.existsSync(new URL(name, IMAGE_DIR)));

const element = (tagName, className, children, properties = {}) => ({
    type: 'element',
    tagName,
    properties: { className: [className], ...properties },
    children,
});
const text = (value) => ({ type: 'text', value });

/**
 * 段落裡每一行都只有一個支援的連結時，回傳這些連結（通常只有一個）；否則回傳 null。
 * 一行一個連結、中間沒空行時（例如原神與星穹鐵道共用一段心得），每行各成一張卡片。
 */
function cardLinks(node, cards) {
    if (node.type !== 'paragraph') return null;
    const links = node.children.filter((child) => child.type === 'link');
    const between = node.children.filter((child) => child.type !== 'link');
    const ok =
        links.length > 0 &&
        links.every((link) => cardOf(link.url, cards)) &&
        between.every((child) => child.type === 'text' && !child.value.trim()) &&
        // 連結之間要換行，同一行的兩個連結不算
        links.slice(1).every((link) => node.children[node.children.indexOf(link) - 1]?.value?.includes('\n'));
    return ok ? links : null;
}

/**
 * 在區塊上加 card-follow：長期紀錄頁用它把緊接在卡片後面的東西貼近卡片（留 16px，白色卡片才不會黏住文字）。
 * 帶 card-follow 的區塊 rehype-tight.mjs 不會再加 tight，兩種間距規則不疊加。
 */
function follow(node) {
    const properties = node.data?.hProperties ?? {};
    node.data = { ...node.data, hProperties: { ...properties, className: [...(properties.className ?? []), 'card-follow'] } };
}

const isComment = (node) => node?.type === 'html' && /^<!--[\s\S]*-->$/.test(node.value.trim());

/** 緊接在 nodes[index] 後面（中間沒有空行）的區塊；只有註解的行（例如 <!-- INSIDE -->）不算空行，會跳過 */
function nextAdjacent(nodes, index) {
    let end = nodes[index].position.end.line;
    for (const node of nodes.slice(index + 1)) {
        if (node.position.start.line !== end + 1) return null;
        if (!isComment(node)) return node;
        end = node.position.end.line;
    }
    return null;
}

function card(link, cards, id) {
    const { platform, key } = cardOf(link.url, cards);
    const info = cards[key] ?? {};
    // 手動登記的卡片沒有平台名稱，來源顯示 label，沒寫就顯示網域
    const { label, noun } = PLATFORMS[platform] ?? {
        label: info.label ?? new URL(link.url).hostname.replace(/^www\./, ''),
        noun: '',
    };
    const written = link.children.map((child) => child.value ?? '').join('').trim();
    // 自己寫的連結文字優先（[標題](網址)），其次是抓到的標題
    const title = (written && written !== link.url ? written : info.title) || `${label} ${noun}`.trim();
    const image = imageOf(key);

    return {
        title,
        node: {
            type: 'linkCard',
            data: {
                hName: 'a',
                hProperties: { href: link.url, className: ['link-card'], id },
                hChildren: [
                    ...(image ? [{ type: 'element', tagName: 'img', properties: { src: `/cards/${image}`, alt: '', loading: 'lazy' }, children: [] }] : []),
                    element('span', 'card-body', [
                        element('span', 'card-title', [text(title)]),
                        element('span', 'card-meta', [text([label, info.author].filter(Boolean).join(' · '))]),
                        ...(info.description ? [element('span', 'card-desc', [text(info.description)])] : []),
                    ]),
                ],
            },
        },
    };
}

export default function remarkLinkCard() {
    return (tree, file) => {
        if (!String(file.path ?? '').replaceAll('\\', '/').includes('/content/beyond/')) return;
        const cards = readCards();
        const toc = [];
        tree.children = tree.children.flatMap((node, index, nodes) => {
            const links = cardLinks(node, cards);
            if (!links) return [node];
            const next = nextAdjacent(nodes, index);
            if (next) follow(next);
            // 這段本身緊接在上一張卡片後面時（前面被 follow 標過），第一張卡片也貼近
            const attached = node.data?.hProperties?.className?.includes('card-follow');
            return links.map((link, order) => {
                const { key } = cardOf(link.url, cards);
                const taken = toc.filter((item) => item.key === key).length;
                const id = `card-${key}${taken ? `-${taken + 1}` : ''}`;
                const { title, node: result } = card(link, cards, id);
                toc.push({ key, title, href: `#${ID_PREFIX}${id}` });
                if (order > 0 || attached) result.data.hProperties.className.push('card-follow');
                return result;
            });
        });
        file.data.astro ??= {};
        file.data.astro.frontmatter ??= {};
        file.data.astro.frontmatter.cards = toc.map(({ title, href }) => ({ title, href }));
    };
}
