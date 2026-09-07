// 讀取 code fence meta 字串中的 title="..."，寫成 <pre data-title="..."> 讓前端顯示標題列
// Carry fence metadata through raw-HTML parsing and sanitization as an escaped attribute.
export function remarkCodeMeta() {
  return (tree) => {
    function visit(node) {
      if (node.type === 'code' && node.meta) {
        node.data ??= {};
        node.data.hProperties = { ...node.data.hProperties, metastring: node.meta };
      }
      for (const child of node.children || []) visit(child);
    }
    visit(tree);
  };
}

export default function transformerCodeTitle() {
  return {
    name: "code-title",
    pre(hast) {
      const raw = this.options.meta?.__raw;
      const match = raw?.match(/title="([^"]*)"/);
      if (match) hast.properties["data-title"] = match[1];
    },
  };
}
