import { describe, it, expect } from 'vitest';
import { SortEngine } from './sortEngine';
import type { Post, SortConfig } from '../types';

const mockPosts: Post[] = [
  {
    id: '3',
    slug: 'median-of-two-sorted-arrays',
    category: 'leetcode',
    title: '尋找兩個排序陣列的中位數',
    enTitle: 'Median of Two Sorted Arrays',
    tagsCN: ['陣列', '二分搜尋'],
    tagEN: ['Array', 'Binary Search'],
    difficulty: 'hard',
    date: 3000,
    searchContent: 'Median of Two Sorted Arrays',
  },
  {
    id: '1',
    slug: 'two-sum',
    category: 'leetcode',
    title: '兩數之和',
    enTitle: 'Two Sum',
    tagsCN: ['陣列', '雜湊表'],
    tagEN: ['Array', 'Hash Table'],
    difficulty: 'easy',
    date: 1000,
    searchContent: '兩數之和 Two Sum',
  },
  {
    id: '2',
    slug: 'add-two-numbers',
    category: 'leetcode',
    title: '兩數相加',
    enTitle: 'Add Two Numbers',
    tagsCN: ['鏈表', '數學'],
    tagEN: ['Linked List', 'Math'],
    difficulty: 'medium',
    date: 2000,
    searchContent: '兩數相加 Add Two Numbers',
  },
];

const mixedIdPosts: Post[] = [
  {
    id: '10',
    slug: 'problem-10',
    category: 'leetcode',
    title: 'Problem 10',
    enTitle: 'Problem 10',
    tagsCN: [],
    tagEN: [],
    difficulty: 'hard',
    date: 1000,
    searchContent: 'Problem 10',
  },
  {
    id: '2a',
    slug: 'problem-2a',
    category: 'leetcode',
    title: 'Problem 2a',
    enTitle: 'Problem 2a',
    tagsCN: [],
    tagEN: [],
    difficulty: 'medium',
    date: 2000,
    searchContent: 'Problem 2a',
  },
  {
    id: '5',
    slug: 'problem-5',
    category: 'leetcode',
    title: 'Problem 5',
    enTitle: 'Problem 5',
    tagsCN: [],
    tagEN: [],
    difficulty: 'easy',
    date: 3000,
    searchContent: 'Problem 5',
  },
];

const engine = new SortEngine();

describe('SortEngine - ID Sort (Numeric)', () => {
  it('應該按 ID 升序排序 (純數字)', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'asc',
    };

    const result = engine.sort(mockPosts, config);
    expect(result.map(p => p.id)).toEqual(['1', '2', '3']);
  });

  it('應該按 ID 降序排序 (純數字)', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'desc',
    };

    const result = engine.sort(mockPosts, config);
    expect(result.map(p => p.id)).toEqual(['3', '2', '1']);
  });

  it('應該不改變原始陣列', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'asc',
    };

    const originalIds = mockPosts.map(p => p.id);
    engine.sort(mockPosts, config);
    expect(mockPosts.map(p => p.id)).toEqual(originalIds);
  });
});

describe('SortEngine - ID Sort (Mixed Type)', () => {
  it('應該支援混合型 ID 排序 (升序)', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'asc',
    };

    const result = engine.sort(mixedIdPosts, config);
    expect(result.map(p => p.id)).toEqual(['10', '2a', '5']);
  });

  it('應該支援混合型 ID 排序 (降序)', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'desc',
    };

    const result = engine.sort(mixedIdPosts, config);
    expect(result.map(p => p.id)).toEqual(['5', '2a', '10']);
  });
});

describe('SortEngine - Date Sort', () => {
  it('應該按日期升序排序', () => {
    const config: SortConfig = {
      field: 'date',
      order: 'asc',
    };

    const result = engine.sort(mockPosts, config);
    expect(result.map(p => p.date)).toEqual([1000, 2000, 3000]);
  });

  it('應該按日期降序排序', () => {
    const config: SortConfig = {
      field: 'date',
      order: 'desc',
    };

    const result = engine.sort(mockPosts, config);
    expect(result.map(p => p.date)).toEqual([3000, 2000, 1000]);
  });

  it('應該正確排序相同日期的項目 (保持穩定排序)', () => {
    const samplePosts: Post[] = [
      {
        id: '1',
        slug: 'p1',
        category: 'leetcode',
        title: 'P1',
        enTitle: 'P1',
        tagsCN: [],
        tagEN: [],
        difficulty: 'easy',
        date: 1000,
        searchContent: 'P1',
      },
      {
        id: '2',
        slug: 'p2',
        category: 'leetcode',
        title: 'P2',
        enTitle: 'P2',
        tagsCN: [],
        tagEN: [],
        difficulty: 'easy',
        date: 1000,
        searchContent: 'P2',
      },
    ];

    const config: SortConfig = {
      field: 'date',
      order: 'asc',
    };

    const result = engine.sort(samplePosts, config);
    expect(result.map(p => p.id)).toEqual(['1', '2']);
  });
});

describe('SortEngine - Edge Cases', () => {
  it('應該處理空陣列', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'asc',
    };

    const result = engine.sort([], config);
    expect(result).toEqual([]);
  });

  it('應該處理單個元素', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'asc',
    };

    const result = engine.sort([mockPosts[0]], config);
    expect(result).toEqual([mockPosts[0]]);
  });
});
