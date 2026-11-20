// 「解題之外」每篇文章的顯示資料。日期預設取自檔名（2026_11_13.md），標題預設就是日期，
// 所以日記原稿不必寫任何 frontmatter。沒有日期的文章視為「長期紀錄」，不進時間軸。
const WEEKDAYS = '日一二三四五六';

interface BeyondSource {
    id: string;
    body?: string;
    filePath?: string;
    data: { title?: string; date?: string; icon?: string };
}

export function describeEntry({ id, body = '', filePath = '', data }: BeyondSource) {
    const iso = data.date ?? id.match(/^(\d{4})[_-](\d{2})[_-](\d{2})/)?.slice(1).join('-');
    const time = iso ? Date.parse(iso) : NaN;
    const dated = Number.isFinite(time);
    const date = new Date(dated ? time : 0);
    const pad = (value: number) => String(value).padStart(2, '0');
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const monthDay = dated ? `${pad(month)}/${pad(day)}` : '';
    const dateText = dated ? `${year}/${monthDay}` : '';
    const text = body
        .split('\n')
        .map((line) => line.replace(/^[#>*\-\s]+/, '').trim())
        .filter((line) => /[\p{L}\p{N}]/u.test(line))
        .join(' ');

    return {
        id,
        href: `/beyond/${id}/`,
        // drafts/ 底下的檔案只在開發模式載入，見 content.config.ts
        draft: filePath.includes('/drafts/'),
        dated,
        time: dated ? time : -Infinity,
        iso: dated ? `${year}-${pad(month)}-${pad(day)}` : undefined,
        year: dated ? String(year) : '',
        /** 月曆用的月份鍵，例如 2024-12 */
        month: dated ? `${year}-${pad(month)}` : '',
        day,
        monthDay,
        weekday: dated ? `週${WEEKDAYS[date.getUTCDay()]}` : '',
        dateText,
        hasTitle: Boolean(data.title),
        title: data.title ?? (dateText || id),
        icon: data.icon,
        excerpt: text.length > 90 ? `${text.slice(0, 90)}…` : text,
        chars: body.replace(/\s/g, '').length,
    };
}

export type BeyondEntry = ReturnType<typeof describeEntry>;

/**
 * 由新到舊；沒有日期的排最後。同一天的多篇依檔名倒序，所以 2025_08_27_2（當天第二篇）排在 2025_08_27 上面。
 * 長期紀錄沒有日期，依檔名正序。
 */
export const newestFirst = (a: BeyondEntry, b: BeyondEntry) =>
    b.time - a.time || (a.dated ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id));

/**
 * 有文章的月份各一張月曆，由新到舊。每張固定 42 格（六週、週日起），空格是 null。
 * 同一天有多篇時，月曆連到 id 排序最前面的那篇。
 */
export function calendarMonths(entries: BeyondEntry[]) {
    const months = new Map<string, Map<number, BeyondEntry>>();
    for (const entry of [...entries].sort((a, b) => a.id.localeCompare(b.id))) {
        if (!entry.dated) continue;
        const days = months.get(entry.month) ?? new Map<number, BeyondEntry>();
        if (!days.has(entry.day)) days.set(entry.day, entry);
        months.set(entry.month, days);
    }
    return [...months]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, days]) => {
            const [year, month] = key.split('-').map(Number);
            const lead = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
            const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
            const cells = Array.from({ length: 42 }, (_, index) => {
                const day = index - lead + 1;
                return day >= 1 && day <= length ? { day, entry: days.get(day) } : null;
            });
            return { key, year, month, cells };
        });
}
