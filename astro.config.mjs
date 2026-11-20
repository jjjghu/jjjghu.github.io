import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkLink from "./src/plugins/remark-link.mjs";
import remarkStrictQuote from "./src/plugins/remark-strict-quote.mjs";
import remarkLinkCard from "./src/plugins/remark-link-card.mjs";
import transformerCodeTitle, { remarkCodeMeta } from "./src/plugins/shiki-code-title.mjs";
import sitemap from "@astrojs/sitemap";
import { scanPosts, sitemapEntry } from "./src/utils/post-catalog.mjs";
import { unified, rehypeShiki } from '@astrojs/markdown-remark';
import rehypeRaw from 'rehype-raw';
import securityPolicy from './src/plugins/security-policy.mjs';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

const posts = scanPosts();

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
            // tight：「解題之外」的引言外掛用來標記「和前文之間沒有空行」（plugins/remark-strict-quote.mjs）
            // card-follow：緊接在連結卡片下一行的區塊（plugins/remark-link-card.mjs）
            p: [['className', 'tight', 'card-follow']],
            blockquote: [['className', 'tight', 'card-follow']],
            ul: [...defaultSchema.attributes.ul.filter((attribute) => !Array.isArray(attribute)), ['className', 'contains-task-list', 'tight', 'card-follow']],
            ol: [...defaultSchema.attributes.ol.filter((attribute) => !Array.isArray(attribute)), ['className', 'contains-task-list', 'tight', 'card-follow']],
            h1: [['className', 'tight']],
            h2: [['className', 'tight']],
            h3: [['className', 'tight']],
            h4: [['className', 'tight']],
            div: [['style', /^text-align:\s*center;?$/]],
          },
        }],
        [rehypeKatex, { trust: false, strict: 'warn', maxExpand: 1000, maxSize: 20 }],
        [rehypeShiki, {
          themes: { dark: 'dark-plus', light: 'light-plus' },
          wrap: false,
          transformers: [transformerCodeTitle()],
        }],
      ],
    }),
  },

  integrations: [
    securityPolicy(),
    sitemap({
      // 「解題之外」不進 sitemap（頁面本身也標了 noindex）
      filter: (page) => !new URL(page).pathname.startsWith("/beyond/"),
      serialize: (item) => sitemapEntry(item, posts),
    }),
  ],
});
