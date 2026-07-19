import { promises as fs } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

// forceLanguage has no observable effect in the UI, so it is verified against
// the index metadata Pagefind writes at build time.
test('forceLanguage pins the index to a single language', async () => {
	const entryPath = path.resolve(
		import.meta.dirname,
		'../../.builds/options-combined/pagefind/pagefind-entry.json'
	)
	const entry = JSON.parse(await fs.readFile(entryPath, 'utf8'))

	expect(Object.keys(entry.languages)).toEqual(['en'])
})

test('an excluded page is still served', async ({ page }) => {
	const response = await page.goto('./internal/secret')

	expect(response?.status()).toBe(200)
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		/internal secret/i
	)
})
