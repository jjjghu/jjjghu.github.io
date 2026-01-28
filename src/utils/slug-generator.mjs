/**
 * Handles the logic for generating the public URL slug for a post.
 * This is the SINGLE SOURCE OF TRUTH for URL generation.
 *
 * @param {string} rawSlug - The initial slug derived from the filename (e.g., "001-two-sum")
 * @param {string|null} problemId - The problem ID from frontmatter (e.g., "1")
 * @returns {string} The final public URL slug (e.g., "two-sum")
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
