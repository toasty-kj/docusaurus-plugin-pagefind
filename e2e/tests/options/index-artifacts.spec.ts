import { expect, test } from '@playwright/test'
import { readPagefindEntry } from '../helpers'

// forceLanguage has no observable effect in the UI, so it is verified against
// the index metadata Pagefind writes at build time. This is the negative half
// of the pair in tests/no-options/index-artifacts.spec.ts: the fixture's
// translated page (<html lang="ja">) is present in this build too, so a
// single 'en' key here is only possible because forceLanguage collapsed it.
test('forceLanguage pins the index to a single language', async () => {
	const entry = await readPagefindEntry('options-combined')

	expect(Object.keys(entry.languages)).toEqual(['en'])
})

test('an excluded page is still served', async ({ page }) => {
	const response = await page.goto('./internal/secret')

	expect(response?.status()).toBe(200)
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		/internal secret/i
	)
})
