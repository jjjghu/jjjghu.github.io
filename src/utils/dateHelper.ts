/**
 * 格式化日期為 YYYY/MM/DD
 * @param dateStr 日期字串 (e.g. "2023-01-01")
 */
export function formatDateEN(dateStr: string): string {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
}

/**
 * 格式化日期為 YYYY年MM月DD日
 * @param dateStr 日期字串
 */
export function formatDateCN(dateStr: string): string {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}年${month}月${day}日`;
}
