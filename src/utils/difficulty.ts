// 難度的唯一來源：鍵的順序即顯示順序，新增難度只改這張表。
// 鍵一律小寫；內容 frontmatter 由 content schema 以 isKnownDifficulty 檢查。
const DIFFICULTIES: Record<string, { cssClass: string; cn?: string; en?: string }> = {
    // LeetCode
    easy: { cssClass: "diff-easy", cn: "簡單", en: "Easy" },
    medium: { cssClass: "diff-medium", cn: "中等", en: "Medium" },
    hard: { cssClass: "diff-hard", cn: "困難", en: "Hard" },

    // 洛谷（由易到難）
    "暫無評定": { cssClass: "diff-0" },
    "入門": { cssClass: "diff-1" },
    "普及-": { cssClass: "diff-2" },
    "普及": { cssClass: "diff-3" },
    "普及/提高-": { cssClass: "diff-3" },
    "普及+/提高-": { cssClass: "diff-4" },
    "普及+/提高": { cssClass: "diff-4" },
    "提高": { cssClass: "diff-5" },
    "提高+/省選-": { cssClass: "diff-5" },
    "省選/noi-": { cssClass: "diff-6" },
    "noi/noi+/ctsc": { cssClass: "diff-7" },
};

const ORDER = Object.keys(DIFFICULTIES);

/** 難度的正規化鍵（小寫、去頭尾空白）；篩選與 data-value 都用它。 */
export const difficultyKey = (difficulty: string | undefined | null): string =>
    (difficulty ?? "").toLowerCase().trim();

const lookup = (difficulty: string | undefined | null) => {
    const key = difficultyKey(difficulty);
    return Object.hasOwn(DIFFICULTIES, key) ? DIFFICULTIES[key] : undefined;
};

export const isKnownDifficulty = (difficulty: string): boolean => lookup(difficulty) !== undefined;

export const getDifficultyClass = (difficulty: string | undefined | null): string =>
    lookup(difficulty)?.cssClass ?? "diff-0";

export function getDifficultyLabel(difficulty: string | undefined | null, isEnglish: boolean = false): string {
    if (!difficulty) return "";
    const entry = lookup(difficulty);
    return (isEnglish ? entry?.en : entry?.cn) ?? difficulty;
}

/** 依表內順序排序；不在表內的排最後。 */
export function sortDifficulties(difficulties: Iterable<string>): string[] {
    const rank = (d: string) => {
        const index = ORDER.indexOf(difficultyKey(d));
        return index === -1 ? ORDER.length : index;
    };
    return [...difficulties].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "zh-Hant"));
}
