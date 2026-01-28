import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkLeetCodeLink from './src/plugins/remark-leetcode-link.mjs';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

// Helper to calculate priority
const getPostMetadata = () => {
  const map = new Map();
  const contentDirs = ['leetcode', 'zerojudge'];

  contentDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), 'src', 'content', dir);
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) return;

      const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');

      // Simple Frontmatter Parse
      const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
      if (!frontmatterMatch) return;

      const fmContent = frontmatterMatch[1];
      const dateMatch = fmContent.match(/date:\s*"?(.+?)"?$/m);
      const problemIdMatch = fmContent.match(/problem_id:\s*"?(.+?)"?$/m);

      const date = dateMatch ? new Date(dateMatch[1]) : null;
      const problemId = problemIdMatch ? problemIdMatch[1] : null;
      const length = content.length;

      // Approximate standard slug generation (github-slugger style)
      // Remove extension
      let name = file.replace(/\.(md|mdx)$/, '');
      // Lowercase, replace non-alphanumeric with dash, trim dashes
      let slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Apply user's logic: remove problem_id prefix
      if (problemId && slug.startsWith(problemId + '-')) {
        slug = slug.replace(problemId + '-', '');
      }

      if (date) {
        map.set(slug, { date, length });
      }
    });
  });
  return map;
};

const postMetaMap = getPostMetadata();

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

  integrations: [sitemap({
    serialize(item) {
      const url = new URL(item.url);
      // Remove leading/trailing slash to get slug
      // e.g., /some-post/ -> some-post
      const slug = url.pathname.replace(/^\/|\/$/g, '');

      if (postMetaMap.has(slug)) {
        const meta = postMetaMap.get(slug);
        const now = new Date();
        const diffDays = (now.getTime() - meta.date.getTime()) / (1000 * 3600 * 24);

        let priority = 0.5;
        let changefreq = 'monthly';

        // Recency Logic
        // < 7 days: daily, 1.0
        // < 30 days: weekly, 0.8
        // < 90 days: monthly, 0.6
        // Else: monthly, 0.5

        if (diffDays < 7) {
          changefreq = 'daily';
          priority = 1.0;
        } else if (diffDays < 30) {
          changefreq = 'weekly';
          priority = 0.8;
        } else if (diffDays < 90) {
          changefreq = 'monthly';
          priority = 0.6;
        }

        // Length Bonus (Longer articles > 5000 chars get slight boost)
        if (meta.length > 5000) {
          priority = Math.min(priority + 0.1, 1.0);
        }

        item.changefreq = changefreq;
        item.priority = priority;
        item.lastmod = meta.date.toISOString();
      } else {
        // Default for non-post pages (home, about, etc)
        // Adjust as needed, maybe Home is 1.0
        if (slug === '') { // Home
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
      }
      return item;
    }
  })],
});