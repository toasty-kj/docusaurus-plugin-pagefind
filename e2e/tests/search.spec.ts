import { expect, test } from '@playwright/test';

const cases = [
	{ name: 'root baseUrl', url: 'http://localhost:3100/' },
	{ name: 'non-root baseUrl', url: 'http://localhost:3101/fixture-base/' },
];

for (const { name, url } of cases) {
	test(`search returns a real result under ${name}`, async ({ page }) => {
		await page.goto(url);

		await page.getByRole('button', { name: /search/i }).click();
		await page.getByPlaceholder(/search/i).fill('zzsearchtoken');

		const hit = page.locator('.pagefindHit').first();
		await expect(hit).toBeVisible({ timeout: 15_000 });
		await expect(hit).toContainText(/findable/i);
	});
}
