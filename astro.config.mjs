import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkLeetCodeLink from './src/plugins/remark-leetcode-link.mjs';
export default defineConfig({
  site: 'https://jjjghu.github.io',

  markdown: {
    remarkPlugins: [remarkMath, remarkLeetCodeLink],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      // 這裡選擇主題，例如: 'dracula', 'github-dark', 'monokai', 'one-dark-pro'
      theme: 'dark-plus',
      // 如果想要讓程式碼區塊自動換行，可以啟用 wrap
      wrap: true,
    },
  },
});