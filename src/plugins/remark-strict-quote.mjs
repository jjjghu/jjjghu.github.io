// 「解題之外」專用：引言只包含真的以 > 開頭的行。標準 Markdown 會把引言後面沒有空行的下一行也併進引言
// （lazy continuation），這裡把那一行拆出來重新解析。拆出來的區塊要不要貼著引言，交給 rehype-tight.mjs 判斷。
// 解題文章不受影響（那邊有文章依賴原本的行為）。
const QUOTE_LINE = /^ {0,3}>/;

/** 重新解析的片段行號從 1 起算，改回它在原稿裡的行號，rehype-tight 才判斷得出有沒有空行 */
function shiftLines(node, by) {
    if (node.position) {
        node.position = {
            start: { ...node.position.start, line: node.position.start.line + by },
            end: { ...node.position.end, line: node.position.end.line + by },
        };
    }
    node.children?.forEach((child) => shiftLines(child, by));
}

export default function remarkStrictQuote() {
    const processor = this;

    /** children 是從 source 解析出來的同一層節點，source 的第一行是原稿第 firstLine 行 */
    const strict = (children, source, firstLine) =>
        children.flatMap((node) => {
            if (node.type !== 'blockquote') return [node];
            const start = node.position.start.line;
            const lines = source.split('\n').slice(start - firstLine, node.position.end.line - firstLine + 1);
            const lazy = lines.findIndex((line) => !QUOTE_LINE.test(line));
            if (lazy < 0) return [node];
            // 第 lazy 行起不屬於引言：前後分開重新解析
            return [...reparse(lines.slice(0, lazy).join('\n'), start), ...reparse(lines.slice(lazy).join('\n'), start + lazy)];
        });

    const reparse = (source, firstLine) => {
        const { children } = processor.parse(source);
        children.forEach((child) => shiftLines(child, firstLine - 1));
        return strict(children, source, firstLine);
    };

    return (tree, file) => {
        if (!String(file.path ?? '').replaceAll('\\', '/').includes('/content/beyond/')) return;
        tree.children = strict(tree.children, String(file.value), 1);
    };
}
