import { describe, it, expect } from 'vitest';
import { filterPosts, sortPosts, compareProblemIds, parseListState, selectPosts } from './postList';
import type { Post, FilterCriteria, SortConfig } from '../types';

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


describe('FilterEngine - Category Filter', () => {
  it('應該按分類篩選 (category=leetcode)', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: 'leetcode',
      searchTerm: '',
    };

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(2);
    expect(result.map(p => p.id)).toEqual(['1', '2']);
  });

  it('應該顯示所有分類 (category=null)', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(3);
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

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  it('應該顯示所有難度 (difficulty=all)', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(3);
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

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  it('AND 邏輯：單個標籤也應該工作', () => {
    const criteria: FilterCriteria = {
      tags: new Set(['鏈表']),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('2');
  });

  it('AND 邏輯：沒有題目同時包含這些標籤時應返回空', () => {
    const criteria: FilterCriteria = {
      tags: new Set(['陣列', '鏈表']),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(0);
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

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(2);
    expect(result.map(p => p.id)).toEqual(['1', '2']);
  });

  it('OR 邏輯：單個標籤也應該工作', () => {
    const criteria: FilterCriteria = {
      tags: new Set(['動態規劃']),
      tagFilterLogic: 'OR',
      difficulty: 'all',
      category: null,
      searchTerm: '',
    };

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('3');
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

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  it('搜尋應該檢查 searchContent 欄位', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: 'hash',
    };

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  it('搜尋無結果時應返回空', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'all',
      category: null,
      searchTerm: 'nonexistent',
    };

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(0);
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

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  it('應該同時應用搜尋和難度篩選', () => {
    const criteria: FilterCriteria = {
      tags: new Set(),
      tagFilterLogic: 'AND',
      difficulty: 'medium',
      category: null,
      searchTerm: 'two',
    };

    const result = filterPosts(mockPosts, criteria);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('2');
  });
});
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


describe('SortEngine - ID Sort (Numeric)', () => {
  it('應該按 ID 升序排序 (純數字)', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'asc',
    };

    const result = sortPosts(mockPosts, config);
    expect(result.map(p => p.id)).toEqual(['1', '2', '3']);
  });

  it('應該按 ID 降序排序 (純數字)', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'desc',
    };

    const result = sortPosts(mockPosts, config);
    expect(result.map(p => p.id)).toEqual(['3', '2', '1']);
  });

  it('應該不改變原始陣列', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'asc',
    };

    const originalIds = mockPosts.map(p => p.id);
    sortPosts(mockPosts, config);
    expect(mockPosts.map(p => p.id)).toEqual(originalIds);
  });
});

describe('SortEngine - ID Sort (Mixed Type)', () => {
  it('應該支援混合型 ID 排序 (升序)', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'asc',
    };

    const result = sortPosts(mixedIdPosts, config);
    expect(result.map(p => p.id)).toEqual(['5', '10', '2a']);
  });

  it('應該支援混合型 ID 排序 (降序)', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'desc',
    };

    const result = sortPosts(mixedIdPosts, config);
    expect(result.map(p => p.id)).toEqual(['2a', '10', '5']);
  });
});

describe('SortEngine - Date Sort', () => {
  it('應該按日期升序排序', () => {
    const config: SortConfig = {
      field: 'date',
      order: 'asc',
    };

    const result = sortPosts(mockPosts, config);
    expect(result.map(p => p.date)).toEqual([1000, 2000, 3000]);
  });

  it('應該按日期降序排序', () => {
    const config: SortConfig = {
      field: 'date',
      order: 'desc',
    };

    const result = sortPosts(mockPosts, config);
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

    const result = sortPosts(samplePosts, config);
    expect(result.map(p => p.id)).toEqual(['1', '2']);
  });
});

describe('SortEngine - Edge Cases', () => {
  it('應該處理空陣列', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'asc',
    };

    const result = sortPosts([], config);
    expect(result).toEqual([]);
  });

  it('應該處理單個元素', () => {
    const config: SortConfig = {
      field: 'id',
      order: 'asc',
    };

    const result = sortPosts([mockPosts[0]], config);
    expect(result).toEqual([mockPosts[0]]);
  });
});

describe('compareProblemIds', () => {
  it('混合題號為全序：數字依數值在前，字串在後，空字串不當成 0', () => {
    const ids = ['1a', '10', '', 'P1048', '9'];
    expect([...ids].sort(compareProblemIds)).toEqual(['9', '10', '', '1a', 'P1048']);
    expect([...ids].reverse().sort(compareProblemIds)).toEqual(['9', '10', '', '1a', 'P1048']);
  });
});

describe('parseListState', () => {
  const none = { sort: null, difficulty: null, tags: null };

  it('沒有偏好時使用預設值', () => {
    expect(parseListState(none, 'leetcode', mockPosts)).toEqual({
      category: 'leetcode',
      sort: { field: 'id', order: 'asc' },
      difficulty: 'all',
      tags: [],
      tagLogic: 'AND',
      searchTerm: '',
    });
  });

  it('難度不屬於目前分類時退回 all', () => {
    const stored = { ...none, difficulty: 'hard' };
    expect(parseListState(stored, 'leetcode', mockPosts).difficulty).toBe('all');
    expect(parseListState(stored, 'zerojudge', mockPosts).difficulty).toBe('hard');
  });

  it('損壞的偏好視為未設定', () => {
    const state = parseListState({ sort: 'bogus-x', difficulty: null, tags: '{not json' }, 'leetcode', mockPosts);
    expect(state.sort).toEqual({ field: 'id', order: 'asc' });
    expect(state.tags).toEqual([]);
  });

  it('selectPosts 依狀態篩選並排序', () => {
    const state = parseListState(
      { sort: 'date-desc', difficulty: null, tags: '{"tags":["陣列","鏈表"],"logic":"OR"}' },
      'leetcode',
      mockPosts,
    );
    expect(selectPosts(mockPosts, state).map(p => p.id)).toEqual(['2', '1']);
  });
});
