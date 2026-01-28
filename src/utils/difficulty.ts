export const DIFFICULTY_LABELS: Record<string, { cn: string, en: string }> = {
    easy: { cn: '簡單', en: 'Easy' },
    medium: { cn: '中等', en: 'Medium' },
    hard: { cn: '困難', en: 'Hard' }
};

export const getDifficultyClass = (difficulty: string | undefined | null): string => {
    if (!difficulty) return "diff-0";

    // Normalize string to match keys
    const lowerDiff = difficulty.toLowerCase().trim();

    // LeetCode specific classes (using original LeetCode colors)
    if (lowerDiff === 'easy') return 'diff-easy';
    if (lowerDiff === 'medium') return 'diff-medium';
    if (lowerDiff === 'hard') return 'diff-hard';

    // Luogu (and others) mapping
    const map: Record<string, string> = {
        // English aliases (for internal use if needed)
        "unrated": "diff-0",
        "intro": "diff-1",
        "popular-": "diff-2",
        "popular": "diff-3",
        "popular+": "diff-4",
        "improve": "diff-5",
        "provincial": "diff-6",
        "noi": "diff-7",

        // Chinese Names (Luogu Official)
        "暫無評定": "diff-0",
        "入門": "diff-1",
        "普及-": "diff-2",
        "普及/提高-": "diff-3",
        "普及+/提高": "diff-4",
        "提高+/省選-": "diff-5",
        "省選/noi-": "diff-6",
        "noi/noi+/ctsc": "diff-7"
    };

    // Special handling for slash which might complicate lowercase mapping if not careful
    // But "普及/提高-" toLowerCase is "普及/提高-" (Chinese characters don't change)
    // "省選/NOI-" -> "省選/noi-"

    return map[lowerDiff] || "diff-0";
};

export function getDifficultyLabel(difficulty: string | undefined | null, isEnglish: boolean = false): string {
    if (!difficulty) return '';

    const lowerDiff = difficulty.toLowerCase();

    // Standard LeetCode translation
    if (lowerDiff in DIFFICULTY_LABELS) {
        return isEnglish ? DIFFICULTY_LABELS[lowerDiff].en : DIFFICULTY_LABELS[lowerDiff].cn;
    }

    // Return as-is for others
    return difficulty;
}
