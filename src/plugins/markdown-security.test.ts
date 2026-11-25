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

it('keeps centre and right alignment on paragraphs and divs, but no other inline style', async () => {
  const { code } = await renderer.render(
    '<p style="text-align:center;">圖說</p>\n\n<div style="text-align:right">2026 / 11 / 25</div>\n\n<p style="color:red">x</p>',
  );
  expect(code).toContain('<p style="text-align:center;">圖說</p>');
  expect(code).toContain('<div style="text-align:right">2026 / 11 / 25</div>');
  expect(code).not.toContain('color:red');
});

it('keeps the site colour variables on spans, and markdown inside them still works', async () => {
  const { code } = await renderer.render('前言 <span style="color:var(--color-fg-muted)">*~~灰色斜體刪除線~~*</span>，<span style="color:gray">x</span>');
  expect(code).toContain('<span style="color:var(--color-fg-muted)"><em><del>灰色斜體刪除線</del></em></span>');
  expect(code).not.toContain('color:gray');
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

it('keeps the line after a quote out of the quote, but only in the beyond section', async () => {
  const source = '前文\n> 註解一\n> 註解二\n後文\n> 第二個註解\n再後文';
  const render = async (path: string) =>
    (await renderer.render(source, { fileURL: new URL(`file:///D:/site/src/content/${path}`) })).code.replace(/\s+/g, ' ');

  // 引言只含 > 開頭的行；和前文之間沒有空行的節點帶 class="tight"
  expect(await render('beyond/2026_01_01.md')).toBe(
    '<p>前文</p> <blockquote class="tight"> <p>註解一 註解二</p> </blockquote> <p class="tight">後文</p> ' +
      '<blockquote class="tight"> <p>第二個註解</p> </blockquote> <p class="tight">再後文</p>',
  );
  expect(
    (await renderer.render('前文\n\n> 註解\n\n後文', { fileURL: new URL('file:///D:/site/src/content/beyond/a.md') })).code,
  ).not.toContain('tight');

  // 解題文章維持標準 Markdown 的行為
  expect(await render('leetcode/0001.md')).toMatch(/<blockquote> <p>註解一 註解二 後文 第二個註解 再後文<\/p>/);
});

it('in the beyond section, any block written right under another sticks to it, like Lark', async () => {
  const render = async (source: string) =>
    (await renderer.render(source, { fileURL: new URL('file:///D:/site/src/content/beyond/a.md') })).code.replace(/\s+/g, ' ');

  expect(await render('說明\n- 一\n- 二\n## 標題\n內文')).toBe(
    '<p>說明</p> <ul class="tight"> <li>一</li> <li>二</li> </ul> <h2 class="tight" id="標題">標題</h2> <p class="tight">內文</p>',
  );
  // 空一行就是一般間距；只有註解的行看不見，不算空行，也不會把空行吃掉
  expect(await render('甲\n\n<!-- 註 -->\n乙\n<!-- 註 -->\n丙')).toBe('<p>甲</p> <p>乙</p> <p class="tight">丙</p>');

  // Books.md：直接寫的 <div> 一樣貼著上一行，空一行再接清單就有間距
  expect(await render('說明\n<div style="text-align:right">日期</div>\n\n- 書')).toBe(
    '<p>說明</p> <div style="text-align:right" class="tight">日期</div> <ul> <li>書</li> </ul>',
  );
});

it('applies the no-blank-line rule to every kind of block, not a fixed list of tags', async () => {
  // 以後新增的區塊種類也要加進這裡；任何一種沒貼上去，這個測試就會失敗
  const blocks = {
    清單: '- 一',
    編號清單: '1. 一',
    標題: '## 標',
    引言: '> 引',
    程式碼: '```\ncode\n```',
    公式: '$$\nx\n$$',
    HTML: '<div style="text-align:center">置中</div>',
    表格: '| a |\n| - |\n| 1 |',
    段落: '<!-- 註 -->\n下一段',
  };
  for (const [name, block] of Object.entries(blocks)) {
    const { code } = await renderer.render(`前文\n\n上一段\n${block}`, {
      fileURL: new URL('file:///D:/site/src/content/beyond/a.md'),
    });
    // 「上一段」本身前面空了一行，不貼；緊接在它後面的區塊（第一個開頭標籤）要貼
    expect(code, name).toMatch(/<p>上一段<\/p>/);
    expect(code.split('上一段</p>')[1].match(/<\w+[^>]*>/)?.[0], name).toContain('tight');
  }
});

it('turns a link that stands alone into a card, but only supported sites in the beyond section', async () => {
  // BV 號刻意不存在於 link-cards.json：沒有抓到資料時，標題用連結文字、沒有縮圖
  const url = 'https://www.bilibili.com/video/BV1aaaaaaaaa';
  const source = `[某支影片](${url})\n\n句子裡的 [連結](${url}) 不變\n\nhttps://example.com/`;
  const render = async (path: string) =>
    (await renderer.render(source, { fileURL: new URL(`file:///D:/site/src/content/${path}`) })).code;

  const beyond = await render('beyond/遊戲.md');
  expect(beyond).toContain(
    `<a href="${url}" class="link-card" id="user-content-card-bilibili-BV1aaaaaaaaa">` +
      '<span class="card-body"><span class="card-title">某支影片</span><span class="card-meta">bilibili</span></span></a>',
  );
  expect(beyond).toContain(`<p>句子裡的 <a href="${url}">連結</a> 不變</p>`);
  expect(beyond.match(/class="link-card"/g)).toHaveLength(1);
  expect(await render('leetcode/0001.md')).not.toContain('link-card');
});

it('turns one link per line into one card per line, but not two links on the same line', async () => {
  const [a, b] = ['https://store.steampowered.com/app/1', 'https://store.steampowered.com/app/2'];
  const render = async (source: string) =>
    (await renderer.render(source, { fileURL: new URL('file:///D:/site/src/content/beyond/長期紀錄/Games.md') })).code;

  const stacked = await render(`[甲](${a})\n[乙](${b})\n- 共用的心得`);
  expect(stacked).toContain(`<a href="${a}" class="link-card"`);
  expect(stacked).toContain(`<a href="${b}" class="link-card card-follow"`);
  expect(stacked).toContain('<ul class="card-follow">');
  expect(await render(`[甲](${a}) [乙](${b})`)).not.toContain('link-card');

  // 中間只隔著註解行時也算緊接著（Games.md 的 LIMBO 與 INSIDE 就是這樣寫的）
  const commented = await render(`<!-- 甲 -->\n${a}\n<!-- 乙 -->\n${b}\n- 共用的心得\n\n${a}`);
  expect(commented).toContain(`<a href="${b}" class="link-card card-follow"`);
  expect(commented).toContain('<ul class="card-follow">');
  expect(commented.match(/class="link-card card-follow"/g)).toHaveLength(1);
});

it('builds cards for sites registered by hand in link-cards.json', async () => {
  const { cardOf } = await import('./remark-link-card.mjs');
  const cards = { game: { url: 'https://example.com/game/', title: '某遊戲' } };
  expect(cardOf('https://example.com/game', cards)).toEqual({ platform: 'custom', id: 'game', key: 'game' });
  expect(cardOf('https://example.com/other', cards)).toBeNull();
});

it('marks what is written right under a card link, and lists the cards for the jump menu', async () => {
  const url = 'https://store.steampowered.com/app/1';
  const result = await renderer.render(`${url}\n- 心得一\n- 心得二\n\n${url}\n\n空一行的段落`, {
    fileURL: new URL('file:///D:/site/src/content/beyond/長期紀錄/Games.md'),
  });
  const html = result.code.replace(/\s+/g, ' ');
  expect(html).toContain('</a> <ul class="card-follow"> <li>心得一</li>');
  expect(html).toContain('</a> <p>空一行的段落</p>');
  // 同一款出現兩次時錨點不重複
  expect(result.metadata.frontmatter.cards).toEqual([
    { title: 'Steam 遊戲', href: '#user-content-card-steam-1' },
    { title: 'Steam 遊戲', href: '#user-content-card-steam-1-2' },
  ]);
});
