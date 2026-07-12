import { slug as githubSlug } from "github-slugger";

/**
 * Convert a markdown filename to the public URL slug, matching Astro's own
 * content-collection slug generation exactly (Astro uses `github-slugger`
 * on each path segment — see node_modules/astro/dist/content/utils.js).
 *
 * This is the SINGLE SOURCE OF TRUTH for turning a filename into a URL.
 * Using the same slugger as Astro avoids drift like "O(1)" becoming
 * "o-1" here vs "o1" in the real route.
 *
 * @param {string} fileName - Markdown filename, e.g. "380. Insert Delete GetRandom O(1).md"
 * @param {string|null} problemId - The problem ID from frontmatter (e.g. "380")
 * @returns {string} The final public URL slug (e.g. "insert-delete-getrandom-o1")
 */
export function fileToSlug(fileName, problemId) {
    const name = fileName.replace(/\.(md|mdx)$/, "");
    return generateSlug(githubSlug(name), problemId);
}

/**
 * Strips the leading problem-ID prefix from an already-slugified string.
 *
 * @param {string} rawSlug - The github-slugger output (e.g. "380-insert-delete-getrandom-o1")
 * @param {string|null} problemId - The problem ID from frontmatter (e.g. "380")
 * @returns {string} The final public URL slug (e.g. "insert-delete-getrandom-o1")
 */
export function generateSlug(rawSlug, problemId) {
    let finalSlug = rawSlug;

    // 1. If problemId is present, try to remove it from the start.
    // We use a flexible regex to handle leading digits + hyphen,
    // which works even if the problemId formatting (001 vs 1) differs slightly from the filename.
    if (problemId) {
        // Logic: Remove "problemId-" or just any leading "digits-"
        // The previous issue was that `3651-title` file vs `3651` ID matches perfectly,
        // but `001-title` file vs `1` ID didn't.
        // The most robust way for LeetCode/ZeroJudge problems (which usually start with ID)
        // is to strip the leading numeric ID + hyphen.

        // Remove specific ID if it matches exactly (safe fall back)
        if (finalSlug.startsWith(problemId + "-")) {
            finalSlug = finalSlug.replace(problemId + "-", "");
        } else {
            // Fallback/Generic: Remove any leading number + hyphen (e.g. 123-two-sum -> two-sum)
            finalSlug = finalSlug.replace(/^\d+-/, "");
        }
    }

    return finalSlug;
}
