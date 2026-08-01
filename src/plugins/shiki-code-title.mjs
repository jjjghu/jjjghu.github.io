// 讀取 code fence meta 字串中的 title="..."，寫成 <pre data-title="..."> 讓前端顯示標題列
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
