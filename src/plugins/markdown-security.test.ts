import { beforeAll, expect, it } from 'vitest';
import config from '../../astro.config.mjs';
import { secureHtml } from './security-policy.mjs';
import { parse } from 'parse5';
import { createHash } from 'node:crypto';

const processor = config.markdown!.processor!;
let renderer: Awaited<ReturnType<typeof processor.createRenderer>>;
beforeAll(async () => {
  renderer = await processor.createRenderer({ syntaxHighlight: false });
});

it('strips executable Markdown HTML but preserves formulas, highlighting and code titles', async () => {
  const { code } = await renderer.render([
    '# Heading',
    '<script>alert(1)</script>',
    '<img src="x" onerror="alert(1)">',
    '<a href="javascript:alert(1)">bad</a>',
    '<iframe src="https://evil.example"></iframe>',
    '<style>body{display:none}</style>',
    '<span style="color:var(--color-accent-fg)">highlight</span>',
    '$x^2$',
    '```cpp title="Solution"\nint value = 1;\n```',
  ].join('\n\n'));
  expect(code).not.toMatch(/<script|onerror=|javascript:|<iframe|<style/);
  expect(code).toContain('class="katex"');
  expect(code).toContain('astro-code');
  expect(code).toContain('data-title="Solution"');
  expect(code).toContain('color:var(--color-accent-fg)');
  expect(code).toContain('id="heading"');
});

it('places CSP before resources and hashes exactly the emitted script content', () => {
  const source = 'window.example = "safe";';
  const html = secureHtml(`<html><head><script>${source}</script></head><body></body></html>`);
  const expected = createHash('sha256').update(source).digest('base64');
  expect(html).toContain(`sha256-${expected}`);
  expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<script>'));
  expect(html).toContain("script-src-attr 'none'");
  expect(html).not.toContain("script-src 'self' 'unsafe-inline'");
  expect(parse(html)).toBeDefined();
});
