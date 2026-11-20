// 「解題之外」專用，讓排版照原稿的空行呈現（像 Lark 那樣：每個區塊上下緊貼，空一行才有一行的間距）：
// 1. 引言只包含真的以 > 開頭的行。標準 Markdown 會把引言後面沒有空行的下一行也併進引言
//    （lazy continuation），這裡把那一行拆出來重新解析。
// 2. 原稿裡和上一個區塊之間沒有空行的區塊（段落、清單、引言、標題……）加上 class="tight"，
//    版面就不留間距（見 BeyondLayout.astro）。只有註解的行（<!-- … -->）看不見，不算空行。
// 解題文章不受影響（那邊有文章依賴原本的行為）。
const QUOTE_LINE = /^ {0,3}>/;

const isComment = (node) => node?.type === 'html' && /^<!--[\s\S]*-->$/.test(node.value.trim());

function tighten(node) {
    if (node) node.data = { ...node.data, hProperties: { ...node.data?.hProperties, className: ['tight'] } };
}

export default function remarkStrictQuote() {
    const processor = this;

    /** children 是從 source 解析出來的同一層節點；回傳處理過的節點。 */
    const strict = (children, source) => {
        // linked[i]：children[i] 和上一個看得見的區塊之間沒有空行（中間可以隔著註解行）
        const linked = [];
        return children.flatMap((node, index) => {
            const before = children[index - 1];
            linked[index] =
                Boolean(before) &&
                node.position.start.line === before.position.end.line + 1 &&
                (!isComment(before) || linked[index - 1]);
            if (isComment(node)) return [node];

            let nodes = [node];
            if (node.type === 'blockquote') {
                const lines = source.slice(node.position.start.offset, node.position.end.offset).split('\n');
                const lazy = lines.findIndex((line) => !QUOTE_LINE.test(line));
                if (lazy >= 0) {
                    // 第 lazy 行起不屬於引言：前後分開重新解析，後半的第一個節點緊接著引言
                    const rest = reparse(lines.slice(lazy).join('\n'));
                    tighten(rest[0]);
                    nodes = [...reparse(lines.slice(0, lazy).join('\n')), ...rest];
                }
            }
            if (linked[index]) tighten(nodes[0]);
            return nodes;
        });
    };

    const reparse = (source) => strict(processor.parse(source).children, source);

    return (tree, file) => {
        if (!String(file.path ?? '').replaceAll('\\', '/').includes('/content/beyond/')) return;
        tree.children = strict(tree.children, String(file.value));
    };
}
