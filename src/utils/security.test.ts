import { describe, expect, it } from 'vitest';
import { serializeJson, isHttpUrl } from './security';
import { parseCustomThemes, validateThemeCss } from './theme-validation';
import { readFrontmatter } from './frontmatter.mjs';

describe('HTML and URL boundaries', () => {
  it('round-trips script-closing payloads without creating HTML', () => {
    const value = { title: '</ScRiPt ><img src=x onerror=alert(1)>\u2028\u2029' };
    const output = serializeJson(value);
    expect(output).not.toContain('<');
    expect(JSON.parse(output)).toEqual(value);
  });
  it.each(['javascript:alert(1)', 'data:text/html,test', '//evil.example', 'https://user:pass@example.com', 'https://example.com/\n'])('rejects unsafe URL %s', value => {
    expect(isHttpUrl(value)).toBe(false);
  });
  it('accepts a problem URL', () => expect(isHttpUrl('https://leetcode.cn/problems/two-sum/')).toBe(true));
});

describe('custom themes', () => {
  it('accepts colors, gradients, media queries and animation', () => {
    expect(validateThemeCss(':root { --color-page-bg: rgb(10, 20, 30); } @media (max-width: 600px) { body { background: linear-gradient(red, blue); } } @keyframes pulse { to { opacity: .5; } }')).toBe(true);
  });
  it.each([
    '@import "https://evil.example/style.css";',
    'body { background: url(https://evil.example/log); }',
    ':root { --image: url(/log); }',
    'body { background: image-set("https://evil.example/log" 1x); }',
    'body { background: u\\72l(https://evil.example/log); }',
    '@font-face { font-family: test; src: local(test); }',
    'body { width: expression(alert(1)); }',
    'body { color: red; broken }',
  ])('rejects unsafe or invalid CSS %s', css => expect(validateThemeCss(css)).toBe(false));
  it.each(['null', '{}', '[null]', 'invalid', '[{"id":"__proto__"}]'])('recovers from corrupt storage %s', raw => {
    expect(parseCustomThemes(raw)).toEqual([]);
  });
  it('keeps names as text data, validates IDs, and drops duplicate themes', () => {
    const theme = { id: 'custom-123', name: '<img src=x onerror=alert(1)>', css: ':root { color: red; }', tags: [] };
    expect(parseCustomThemes(JSON.stringify([theme, theme]))).toEqual([theme]);
    expect(parseCustomThemes(JSON.stringify([{ ...theme, id: 'custom-" onclick="alert(1)' }]))).toEqual([]);
  });
});

describe('frontmatter', () => {
  it('parses quoted YAML and CRLF without reading metadata from the body', () => {
    expect(readFrontmatter('---\r\ntitle: "A: B"\r\nproblem_id: "1"\r\n---\r\nproblem_id: "evil"')).toEqual({ title: 'A: B', problem_id: '1' });
  });
  it('rejects duplicate keys', () => expect(() => readFrontmatter('---\ntitle: a\ntitle: b\n---\n')).toThrow());
});
