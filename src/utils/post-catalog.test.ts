import { expect, it } from 'vitest';
import { scanPosts, sitemapEntry } from './post-catalog.mjs';

const now = new Date('2026-06-30T00:00:00Z');
const posts = [
  { slug: 'p1048-採藥', problemId: 'P1048', title: '採藥', date: new Date('2026-06-28T00:00:00Z'), length: 6000 },
  { slug: 'two-sum', problemId: '1', title: '兩數之和', date: new Date('2025-01-01T00:00:00Z'), length: 100 },
];

it('finds posts whose slug is percent-encoded in the sitemap URL', () => {
  const item = sitemapEntry({ url: `https://example.com/${encodeURIComponent('p1048-採藥')}/` }, posts, now);
  expect(item).toMatchObject({ changefreq: 'daily', priority: 1.0, lastmod: '2026-06-28T00:00:00.000Z' });
});

it('ranks old posts low, the home page high, and leaves other pages alone', () => {
  expect(sitemapEntry({ url: 'https://example.com/two-sum/' }, posts, now)).toMatchObject({ changefreq: 'monthly', priority: 0.5 });
  expect(sitemapEntry({ url: 'https://example.com/' }, posts, now)).toMatchObject({ priority: 1.0, changefreq: 'daily' });
  expect(sitemapEntry({ url: 'https://example.com/themes/' }, posts, now)).toEqual({ url: 'https://example.com/themes/' });
});

it('scans the real content with unique slugs', () => {
  const scanned = scanPosts();
  expect(scanned.length).toBeGreaterThan(0);
  expect(new Set(scanned.map((p) => p.slug)).size).toBe(scanned.length);
});
