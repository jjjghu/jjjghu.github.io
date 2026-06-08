import type { Post, SortConfig } from "../types";

export class SortEngine {
  sort(posts: Post[], config: SortConfig): Post[] {
    const sorted = [...posts];

    sorted.sort((a, b) => {
      if (config.field === "id") {
        return this.compareIds(a.id, b.id, config.order);
      } else if (config.field === "date") {
        return this.compareDates(a.date, b.date, config.order);
      }

      return 0;
    });

    return sorted;
  }

  private compareIds(aId: string, bId: string, order: "asc" | "desc"): number {
    const numA = Number(aId);
    const numB = Number(bId);
    const isNumA = !isNaN(numA);
    const isNumB = !isNaN(numB);

    if (isNumA && isNumB) {
      // 兩個都是數字，用數字比較
      return order === "asc" ? numA - numB : numB - numA;
    }

    // 字串比較（包括非數字的情況）
    const result = aId.localeCompare(bId);
    return order === "asc" ? result : -result;
  }

  private compareDates(
    aDate: number,
    bDate: number,
    order: "asc" | "desc"
  ): number {
    return order === "asc" ? aDate - bDate : bDate - aDate;
  }
}
