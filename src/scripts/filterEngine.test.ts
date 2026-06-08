import { describe, it, expect } from 'vitest';
import { FilterEngine } from './filterEngine';
import type { Post, FilterCriteria } from '../types';

const mockPosts: Post[] = [
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
    searchContent: '兩數之和 Two Sum Array Hash Table',
  },
  {
    id: '2',
    slug: 'add-two-numbers',
    category: 'leetcode',
    title: '兩數相加',
    enTitle: 'Add Two Numbers',
    tagsCN: ['鏈表'],
    tagEN: ['Linked List'],
    difficulty: 'medium',
    date: 2000,
    searchContent: '兩數相加 Add Two Numbers Linked List',
  },
  {
    id: '3',
    slug: 'zerojudge-problem',
    category: 'zerojudge',
    title: 'ZeroJudge 題目',
    enTitle: 'ZeroJudge Problem',
    tagsCN: ['動態規劃'],
    tagEN: ['Dynamic Programming'],
    difficulty: 'hard',
    date: 3000,
    searchContent: 'ZeroJudge Problem Dynamic Programming',
  },
];

const engine = new FilterEngine();

describe('FilterEngine - Category Filter', () => {
  it('應該按分類篩選 (category=leetcode)', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: 'leetcode',
      searchTerm: '',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(2);
    expect(result.posts.map(p => p.id)).toEqual(['1', '2']);
  });

  it('應該顯示所有分類 (category=null)', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(3);
  });
});

describe('FilterEngine - Difficulty Filter', () => {
  it('應該按難度篩選 (difficulty=easy)', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'easy',
      category: null,
      searchTerm: '',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(1);
    expect(result.posts[0].id).toBe('1');
  });

  it('應該顯示所有難度 (difficulty=all)', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(3);
  });
});

describe('FilterEngine - Tag Filter (AND Logic)', () => {
  it('應該支援 AND 邏輯：只留包含全部標籤的題目', () => {
    const criteria: FilterCriteria = {
      tags: new Set(['陣列', '雜湊表']),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(1);
    expect(result.posts[0].id).toBe('1');
  });

  it('AND 邏輯：單個標籤也應該工作', () => {
    const criteria: FilterCriteria = {
      tags: new Set(['鏈表']),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(1);
    expect(result.posts[0].id).toBe('2');
  });

  it('AND 邏輯：沒有題目同時包含這些標籤時應返回空', () => {
    const criteria: FilterCriteria = {
      tags: new Set(['陣列', '鏈表']),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(0);
  });
});

describe('FilterEngine - Tag Filter (OR Logic)', () => {
  it('應該支援 OR 邏輯：留有任何一個選中標籤的題目', () => {
    const criteria: FilterCriteria = {
      tags: new Set(['陣列', '鏈表']),
      tagFilterLogic: 'OR',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(2);
    expect(result.posts.map(p => p.id)).toEqual(['1', '2']);
  });

  it('OR 邏輯：單個標籤也應該工作', () => {
    const criteria: FilterCriteria = {
      tags: new Set(['動態規劃']),
      tagFilterLogic: 'OR',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(1);
    expect(result.posts[0].id).toBe('3');
  });
});

describe('FilterEngine - Search Filter', () => {
  it('應該進行不區分大小寫的文本搜尋', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: 'hash',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(1);
    expect(result.posts[0].id).toBe('1');
  });

  it('搜尋應該檢查 searchContent 欄位', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: 'hash',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(1);
    expect(result.posts[0].id).toBe('1');
  });

  it('搜尋無結果時應返回空', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: 'nonexistent',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(0);
  });
});

describe('FilterEngine - Combined Filters', () => {
  it('應該同時應用分類、難度、標籤篩選', () => {
    const criteria: FilterCriteria = {
      tags: new Set(['陣列']),
      tagFilterLogic: 'AND',
      difficulty: 'easy',
      category: 'leetcode',
      searchTerm: '',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(1);
    expect(result.posts[0].id).toBe('1');
  });

  it('應該同時應用搜尋和難度篩選', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'medium',
      category: null,
      searchTerm: 'two',
    };

    const result = engine.filter(mockPosts, criteria);
    expect(result.count).toBe(1);
    expect(result.posts[0].id).toBe('2');
  });
});
