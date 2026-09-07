import { expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { readFrontmatter } from '../src/utils/frontmatter.mjs';
import { fileToSlug } from '../src/utils/slug-generator.mjs';
import { isHttpUrl } from '../src/utils/security';

it('keeps all published content routes unique and external links safe', () => {
  const routes = new Set(['themes']);
  const errors: string[] = [];
  for (const collection of ['leetcode', 'zerojudge', 'articles']) {
    const directory = `src/content/${collection}`;
    for (const file of readdirSync(directory).filter(name => name.endsWith('.md') && !name.startsWith('.'))) {
      const data = readFrontmatter(readFileSync(`${directory}/${file}`, 'utf8'));
      for (const key of ['link', 'en_link']) {
        if (data[key] && !isHttpUrl(data[key])) errors.push(`${file}: invalid ${key}`);
      }
      const route = fileToSlug(file, collection === 'articles' ? null : data.problem_id);
      if (!route || routes.has(route)) errors.push(`${file}: duplicate or empty route ${route}`);
      routes.add(route);
    }
  }
  expect(errors).toEqual([]);
});
