import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseProblemSlug, createNote, fetchQuestion } from './create-leetcode.js';
import { readFrontmatter } from '../src/utils/frontmatter.mjs';

const question = { questionFrontendId: '1', title: 'Two "Quoted": Values', translatedTitle: 'A: B', difficulty: 'Easy', topicTags: [{ slug: 'array' }] };

describe('LeetCode import', () => {
  it.each(['two-sum', 'https://leetcode.cn/problems/two-sum/description/?envType=daily-question', 'https://leetcode.com/problems/two-sum/'])('accepts %s', value => {
    expect(parseProblemSlug(value)).toBe('two-sum');
  });
  it.each(['../../evil', '..\\evil', 'https://evil.example/problems/two-sum/', 'https://leetcode.com.evil.example/problems/two-sum/', 'https://user@leetcode.com/problems/two-sum/', 'javascript:alert(1)'])('rejects %s', value => {
    expect(() => parseProblemSlug(value)).toThrow();
  });
  it('serializes external metadata correctly and never overwrites a note', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'notes-security-'));
    try {
      const file = createNote(question, 'two-sum', directory);
      const original = readFileSync(file, 'utf8');
      expect(readFrontmatter(original).en_title).toBe('1. Two "Quoted": Values');
      expect(original).toContain('```cpp\n\n```');
      expect(() => createNote(question, 'two-sum', directory)).toThrow();
      expect(readFileSync(file, 'utf8')).toBe(original);
      for (const id of ['../evil', '..\\evil', 'C:\\evil', '1:stream', 'CON']) {
        expect(() => createNote({ ...question, questionFrontendId: id }, 'two-sum', directory)).toThrow();
      }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  it('rejects newlines in API metadata', () => {
    expect(() => createNote({ ...question, title: 'title\n---\n<script>alert(1)</script>' }, 'two-sum')).toThrow();
  });
  it('uses a fixed endpoint, timeout and forbidden redirects', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: { question } }), { headers: { 'Content-Type': 'application/json' } }));
    await expect(fetchQuestion('two-sum', fetcher)).resolves.toEqual(question);
    expect(fetcher).toHaveBeenCalledWith('https://leetcode.cn/graphql', expect.objectContaining({ redirect: 'error', signal: expect.any(AbortSignal) }));
  });
  it('rejects oversized responses and API errors', async () => {
    await expect(fetchQuestion('two-sum', async () => new Response('x'.repeat(1_000_001), { headers: { 'Content-Type': 'application/json' } }))).rejects.toThrow('too large');
    await expect(fetchQuestion('two-sum', async () => new Response('<html>blocked</html>'))).rejects.toThrow('JSON');
    await expect(fetchQuestion('two-sum', async () => new Response('{}', { status: 500 }))).rejects.toThrow('500');
  });
});
