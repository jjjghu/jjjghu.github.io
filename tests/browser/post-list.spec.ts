import { expect, test } from '@playwright/test';

const visibleRows = '#post-list .file-row:visible';

test('a difficulty saved in one category does not empty another category', async ({ page }) => {
  await page.goto('/');
  await page.click('#diff-btn');
  await page.click('#diff-menu [data-value="hard"]');
  await expect(page.locator('#diff-btn .diff-label')).toHaveText('困難');
  const hardCount = await page.locator(visibleRows).count();
  expect(hardCount).toBeGreaterThan(0);

  await page.goto('/?category=zerojudge');
  await expect(page.locator('#diff-btn .diff-label')).toHaveText('所有難度');
  expect(await page.locator(visibleRows).count()).toBeGreaterThan(0);
  await expect(page.locator('#diff-menu [data-value="hard"]')).toBeHidden();

  // 回到 LeetCode 仍記得「困難」
  await page.goto('/');
  await expect(page.locator(visibleRows)).toHaveCount(hardCount);
});

test('dropdowns close on outside click and only one is open at a time', async ({ page }) => {
  await page.goto('/');
  await page.click('#sort-btn');
  await expect(page.locator('#sort-menu')).toBeVisible();
  await page.click('#diff-btn');
  await expect(page.locator('#sort-menu')).toBeHidden();
  await expect(page.locator('#diff-menu')).toBeVisible();
  await page.click('.file-list-header');
  await expect(page.locator('#diff-menu')).toBeHidden();
});

test('sort, tags, search and language all drive the same list', async ({ page }) => {
  await page.goto('/');
  const total = await page.locator(visibleRows).count();
  const firstId = () => page.locator(visibleRows).first().getAttribute('data-post-id');
  const before = await firstId();

  await page.click('#sort-btn');
  await page.click('#sort-menu [data-field="id"][data-order="desc"]');
  expect(await firstId()).not.toBe(before);

  await page.click('#tag-filter-btn');
  await page.locator('#tag-list .tag-chip').first().click();
  await expect(page.locator('#selected-count')).toHaveText('1');
  const tagged = await page.locator(visibleRows).count();
  expect(tagged).toBeLessThan(total);
  await expect(page.locator('#result-count')).toHaveText(`共 ${tagged} 篇`);

  await page.click('#lang-toggle');
  await expect(page.locator('#result-count')).toHaveText(`Total ${tagged} posts`);
  await expect(page.locator('#logic-text')).toHaveText('Match All (AND)');

  // 點語言按鈕算點擊外部，選單已關閉，要重新打開
  await expect(page.locator('#tag-dropdown')).toBeHidden();
  await page.click('#tag-filter-btn');
  await page.click('#clear-tags');
  await page.fill('#text-search', 'zzzz-no-such-post');
  await expect(page.locator(visibleRows)).toHaveCount(0);
  await expect(page.locator('#no-results')).toHaveText('No matching posts found.');

  // 偏好在重新載入後保留
  await page.reload();
  expect(await firstId()).not.toBe(before);
  await expect(page.locator(visibleRows)).toHaveCount(total);
});
