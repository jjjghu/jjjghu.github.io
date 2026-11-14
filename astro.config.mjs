import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkLink from "./src/plugins/remark-link.mjs";
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
      remarkPlugins: [remarkMath, remarkLink, remarkCodeMeta],
      rehypePlugins: [
        rehypeRaw,
        [rehypeSanitize, {
          ...defaultSchema,
          strip: [...(defaultSchema.strip || []), 'style', 'iframe'],
          attributes: {
            ...defaultSchema.attributes,
            code: [...(defaultSchema.attributes.code || []), 'metastring', ['className', /^language-./, 'math-inline', 'math-display']],
            span: [['style', /^color:\s*var\(--color-accent-fg\);?$/, /^margin-left:\s*2rem;?$/]],
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
    sitemap({ serialize: (item) => sitemapEntry(item, posts) }),
  ],
});
