export const DIFFICULTY_COLORS = {
    // LeetCode specific: { dark: color, light: color }
    easy: { dark: '#00B8A3', light: '#00af9b' },   // Green
    medium: { dark: '#FFC01E', light: '#e5ac1b' }, // Yellow/Orange
    hard: { dark: '#FF375F', light: '#ff2d55' },   // Red

    // Default fallback
    default: { dark: '#8b949e', light: '#57606a' } // Grey
};

export const DIFFICULTY_LABELS: Record<string, { cn: string, en: string }> = {
    easy: { cn: '簡單', en: 'Easy' },
    medium: { cn: '中等', en: 'Medium' },
    hard: { cn: '困難', en: 'Hard' }
};

export function getDifficultyColor(difficulty?: string | null): { dark: string, light: string } {
    if (!difficulty) return DIFFICULTY_COLORS.default;

    const lowerDiff = difficulty.toLowerCase();

    // LeetCode standard difficulties
    if (lowerDiff in DIFFICULTY_COLORS) {
        return DIFFICULTY_COLORS[lowerDiff as keyof typeof DIFFICULTY_COLORS];
    }

    // CodeForce (Numeric usually)
    if (!isNaN(Number(lowerDiff))) {
        return { dark: '#a0a0a0', light: '#6e7781' };
    }

    return DIFFICULTY_COLORS.default;
}

export function getDifficultyLabel(difficulty: string | undefined | null, isEnglish: boolean = false): string {
    if (!difficulty) return '';

    const lowerDiff = difficulty.toLowerCase();

    // Standard LeetCode mapping
    if (lowerDiff in DIFFICULTY_LABELS) {
        return isEnglish ? DIFFICULTY_LABELS[lowerDiff].en : DIFFICULTY_LABELS[lowerDiff].cn;
    }

    // Return as-is for CodeForce (numbers) or others
    return difficulty;
}
