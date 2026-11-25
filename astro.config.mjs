import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkLink from "./src/plugins/remark-link.mjs";
import remarkStrictQuote from "./src/plugins/remark-strict-quote.mjs";
import remarkLinkCard from "./src/plugins/remark-link-card.mjs";
import rehypeTight, { keepPosition } from "./src/plugins/rehype-tight.mjs";
import beyondPreviewSync from "./src/plugins/beyond-preview-sync.mjs";
import transformerCodeTitle, { remarkCodeMeta } from "./src/plugins/shiki-code-title.mjs";
import sitemap from "@astrojs/sitemap";
import { scanPosts, sitemapEntry } from "./src/utils/post-catalog.mjs";
import { unified, rehypeShiki } from '@astrojs/markdown-remark';
import rehypeRaw from 'rehype-raw';
import securityPolicy from './src/plugins/security-policy.mjs';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

const posts = scanPosts();
// <p> 或 <div> 加 style="text-align:center" / "text-align:right" 可以置中、靠右
const ALIGN = ['style', /^text-align:\s*(?:center|right);?$/];

export default defineConfig({
  site: "https://jjjghu.github.io",
  server: { host: '127.0.0.1' },

  markdown: {
    syntaxHighlight: false,
    processor: unified({
      remarkPlugins: [remarkMath, remarkStrictQuote, remarkLinkCard, remarkLink, remarkCodeMeta],
      rehypePlugins: [
        rehypeRaw,
        [rehypeSanitize, {
          ...defaultSchema,
          strip: [...(defaultSchema.strip || []), 'style', 'iframe'],
          attributes: {
            ...defaultSchema.attributes,
            code: [...(defaultSchema.attributes.code || []), 'metastring', ['className', /^language-./, 'math-inline', 'math-display']],
            span: [
              ['style', /^color:\s*var\(--color-accent-fg\);?$/, /^margin-left:\s*2rem;?$/],
              ['className', 'card-body', 'card-title', 'card-meta', 'card-desc'],
            ],
            // 「解題之外」的連結卡片（plugins/remark-link-card.mjs）
            a: [
              ...defaultSchema.attributes.a.filter((attribute) => !Array.isArray(attribute)),
              ['className', 'data-footnote-backref', 'link-card', 'card-follow'],
            ],
            img: [...defaultSchema.attributes.img, ['loading', 'lazy']],
            // card-follow：緊接在連結卡片下一行的區塊（plugins/remark-link-card.mjs）
            // （tight 由最後的 rehype-tight 加上，不經過這裡）
            p: [['className', 'card-follow'], ALIGN],
            blockquote: [...defaultSchema.attributes.blockquote, ['className', 'card-follow']],
            ul: [...defaultSchema.attributes.ul.filter((attribute) => !Array.isArray(attribute)), ['className', 'contains-task-list', 'card-follow']],
            ol: [...defaultSchema.attributes.ol.filter((attribute) => !Array.isArray(attribute)), ['className', 'contains-task-list', 'card-follow']],
            div: [ALIGN],
          },
        }],
        [keepPosition(rehypeKatex), { trust: false, strict: 'warn', maxExpand: 1000, maxSize: 20 }],
        [keepPosition(rehypeShiki), {
          themes: { dark: 'dark-plus', light: 'light-plus' },
          wrap: false,
          transformers: [transformerCodeTitle()],
        }],
        rehypeTight,
      ],
    }),
  },

  // 開發時存檔「解題之外」的文章，預覽網頁自動跳到那一篇
  vite: { plugins: [beyondPreviewSync()] },

  integrations: [
    securityPolicy(),
    sitemap({
      // 「解題之外」不進 sitemap（頁面本身也標了 noindex）
      filter: (page) => !new URL(page).pathname.startsWith("/beyond/"),
      serialize: (item) => sitemapEntry(item, posts),
    }),
  ],
});
