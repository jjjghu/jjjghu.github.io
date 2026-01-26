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
      theme: 'dark-plus',
      wrap: false,
    },
  },
});