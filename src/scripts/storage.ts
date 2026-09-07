// Keep settings usable for this page when browser storage is blocked or full.
const fallback = new Map<string, string | null>();

export const storage = {
  getItem(key: string): string | null {
    if (fallback.has(key)) return fallback.get(key) ?? null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      fallback.delete(key);
      return true;
    } catch {
      fallback.set(key, value);
      return false;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      fallback.delete(key);
    } catch { fallback.set(key, null); }
  },
};
