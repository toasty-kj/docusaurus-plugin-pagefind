import { expect, test } from '@playwright/test';

// Runs once per variant project (see playwright.config.ts); baseURL carries
// the variant's origin and baseUrl. './' (not '/') — an absolute path would
// resolve against the origin and drop a non-root baseUrl like /fixture-base/.
test('search returns a real result', async ({ page }) => {
	await page.goto('./');

	await page.getByRole('button', { name: /search/i }).click();
	await page.getByPlaceholder(/search/i).fill('zzsearchtoken');

	const hit = page.locator('.pagefindHit').first();
	await expect(hit).toBeVisible({ timeout: 15_000 });
	await expect(hit).toContainText(/findable/i);
});
