// 「解題之外」的排版照原稿的空行呈現（像 Lark）：和上一個區塊之間沒有空行的區塊加上 class="tight"，
// 版面就不留間距（見 BeyondLayout.astro）。只有註解的行（<!-- … -->）看不見，但不算空行。
//
// 在所有外掛都跑完之後才判斷，只看原稿：兩個區塊之間的行裡有沒有空行，不看是哪一種區塊。
// 段落、清單、標題、程式碼、公式、直接寫的 <div>……都適用同一條規則，以後多出新種類的區塊也不用改這裡
// （測試 markdown-security.test.ts 逐一列出各種區塊）。
// 緊接在連結卡片下面的區塊（card-follow，見 remark-link-card.mjs）有自己的間距，不再加 tight。

export default function rehypeTight() {
    return (tree, file) => {
        if (!String(file.path ?? '').replaceAll('\\', '/').includes('/content/beyond/')) return;
        const lines = String(file.value).split('\n');
        const blocks = tree.children.filter((node) => node.type === 'element');
        blocks.forEach((node, index) => {
            const before = blocks[index - 1];
            if (!before?.position || !node.position) return;
            // 行號從 1 起算；between 是兩個區塊中間的行（只有註解的行也在裡面）
            const between = lines.slice(before.position.end.line, node.position.start.line - 1);
            // 程式碼上色產生的節點把 class 寫成字串屬性 class，一般節點是陣列 className，合併成一個
            const { class: raw = '', className = [] } = node.properties;
            const names = [...className, ...String(raw).split(/\s+/).filter(Boolean)];
            if (between.some((line) => !line.trim()) || names.includes('card-follow')) return;
            delete node.properties.class;
            node.properties.className = [...names, 'tight'];
        });
    };
}

/** 包住會整個換掉區塊的外掛（程式碼上色、公式），換完把原本的行號補回去，rehypeTight 才判斷得了 */
export const keepPosition = (plugin) =>
    function (...options) {
        const transform = plugin.apply(this, options);
        return async (tree, file) => {
            const positions = tree.children.map((node) => node.position);
            await transform(tree, file);
            tree.children.forEach((node, index) => (node.position ??= positions[index]));
        };
    };
