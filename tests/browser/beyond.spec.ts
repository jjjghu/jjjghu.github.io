import { expect, test } from '@playwright/test';

// 「解題之外」發布哪些文章由作者決定（可能一篇都沒有），所以這裡只驗證不依賴內容的部分；
// 有已發布的日記時，再多驗證月曆與單篇頁。
test('the beyond section is reachable from the footer but hidden from search engines and the problem list', async ({ page, request }) => {
  await page.goto('/');
  await page.click('footer a[href="/beyond/"]');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');

  // drafts/ 底下未篩選的日記絕不能出現在建置結果裡
  await expect(page.locator('body')).not.toContainText('草稿');

  const entries = page.locator('.beyond-list a, .record-list a');
  if (await page.locator('.beyond-list a').count()) {
    // 月曆腳本在 CSP 下有執行，而且有文章的日子連得到文章
    await expect(page.locator('#cal')).toHaveAttribute('data-ready', '');
    await expect(page.locator('.cal-sheet.is-current a').first()).toHaveAttribute('href', /^\/beyond\/.+\/$/);
  }
  if (await entries.count()) {
    const title = (await entries.first().locator('.list-title').count())
      ? await entries.first().locator('.list-title').innerText()
      : undefined;
    await entries.first().click();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    if (title) {
      await expect(page.locator('h1')).toHaveText(title);
      await page.goto('/');
      await expect(page.locator('#post-list')).not.toContainText(title);
    }
  }

  expect(await (await request.get('/sitemap-0.xml')).text()).not.toContain('/beyond/');
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});
