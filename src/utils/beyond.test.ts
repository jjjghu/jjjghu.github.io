import { describe, expect, it } from 'vitest';
import { calendarMonths, describeEntry, newestFirst } from './beyond';

const entry = (id: string, data = {}) => describeEntry({ id, body: '內文', data });

describe('beyond entries', () => {
    it('takes the date from the file name and falls back to it as the title', () => {
        expect(entry('2026_11_13')).toMatchObject({
            dated: true,
            iso: '2026-11-13',
            month: '2026-11',
            day: 13,
            weekday: '週五',
            title: '2026/11/13',
            hasTitle: false,
        });
    });

    it('treats entries without a date as long-term records, sorted last', () => {
        const record = entry('遊戲清單', { title: '玩過的遊戲' });
        expect(record).toMatchObject({ dated: false, month: '', title: '玩過的遊戲' });
        expect([record, entry('2020_01_01')].sort(newestFirst)[0].id).toBe('2020_01_01');
    });

    it('puts the later post of the same day first, so prev/next follow writing order', () => {
        const ids = [entry('2025_08_26'), entry('2025_08_27'), entry('2025_08_28'), entry('2025_08_27_2')]
            .sort(newestFirst)
            .map((item) => item.id);
        expect(ids).toEqual(['2025_08_28', '2025_08_27_2', '2025_08_27', '2025_08_26']);
    });

    it('builds one 42-cell sheet per month that has entries, newest first', () => {
        const months = calendarMonths([entry('2024_02_29'), entry('2026_11_13'), entry('2026_11_13-2'), entry('清單')]);
        expect(months.map((month) => month.key)).toEqual(['2026-11', '2024-02']);

        const [november, february] = months;
        expect(november.cells).toHaveLength(42);
        // 2026/11/1 是週日，所以第一格就是 1 號；同一天兩篇時連到 id 較前面的
        expect(november.cells[0]).toMatchObject({ day: 1 });
        expect(november.cells[12]?.entry?.id).toBe('2026_11_13');
        expect(november.cells[30]).toBeNull();
        // 2024/2/1 是週四，閏年有 29 號
        expect(february.cells[3]).toBeNull();
        expect(february.cells[4]).toMatchObject({ day: 1 });
        expect(february.cells[32]?.entry?.id).toBe('2024_02_29');
    });
});
