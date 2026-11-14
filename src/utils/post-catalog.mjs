// 建置設定與 remark 外掛用的文章目錄（它們拿不到 astro:content，所以直接掃檔案）。
// 掃描條件與 content.config.ts 的 loader 一致：.md、非 . 開頭。
import fs from "node:fs";
import path from "node:path";
import { fileToSlug } from "./slug-generator.mjs";
import { readFrontmatter } from "./frontmatter.mjs";

const POST_DIRS = ["leetcode", "zerojudge"];

/**
 * @returns {{ slug: string, problemId: string | null, title: string, date: Date | null, length: number }[]}
 */
// ponytail: 每次呼叫都重掃（約 300 個小檔），dev 模式才看得到新文章；變慢再加快取。
export function scanPosts(contentRoot = path.join(process.cwd(), "src", "content")) {
    return POST_DIRS.flatMap((dir) => {
        const dirPath = path.join(contentRoot, dir);
        if (!fs.existsSync(dirPath)) return [];

        return fs.readdirSync(dirPath)
            .filter((file) => file.endsWith(".md") && !file.startsWith("."))
            .map((file) => {
                const content = fs.readFileSync(path.join(dirPath, file), "utf-8");
                const metadata = readFrontmatter(content);
                const problemId = metadata.problem_id ? String(metadata.problem_id).trim() : null;
                const date = metadata.date ? new Date(metadata.date) : null;
                return {
                    slug: fileToSlug(file, problemId),
                    problemId,
                    title: String(metadata.title || problemId || ""),
                    date: date && Number.isFinite(date.getTime()) ? date : null,
                    length: content.length,
                };
            });
    });
}

/**
 * 依文章新舊與長度填入 sitemap 的 lastmod / changefreq / priority。
 * @param {{ url: string, [key: string]: unknown }} item
 * @param {ReturnType<typeof scanPosts>} posts
 */
export function sitemapEntry(item, posts, now = new Date()) {
    // pathname 是百分比編碼，中文 slug 要先解碼才查得到
    const slug = decodeURIComponent(new URL(item.url).pathname).replace(/^\/|\/$/g, "");

    if (slug === "") return { ...item, priority: 1.0, changefreq: "daily" };

    const post = posts.find((p) => p.slug === slug);
    if (!post?.date) return item;

    const ageDays = (now.getTime() - post.date.getTime()) / (1000 * 3600 * 24);
    const [changefreq, base] =
        ageDays < 7 ? ["daily", 1.0] : ageDays < 30 ? ["weekly", 0.8] : ageDays < 90 ? ["monthly", 0.6] : ["monthly", 0.5];
    // 長文（> 5000 字元）略為加分
    const priority = post.length > 5000 ? Math.min(base + 0.1, 1.0) : base;

    return { ...item, changefreq, priority, lastmod: post.date.toISOString() };
}
