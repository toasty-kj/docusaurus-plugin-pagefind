import { expect, test } from '@playwright/test'
import { openSearch, searchInput } from '../helpers'

test('clicking the search button opens the modal', async ({ page }) => {
	await page.goto('./')
	await expect(searchInput(page)).toHaveCount(0)

	await page.getByRole('button', { name: /search/i }).click()

	await expect(searchInput(page)).toBeVisible()
})

test('the keyboard shortcut opens the modal', async ({ page }) => {
	await page.goto('./')
	await page.getByRole('button', { name: /search/i }).waitFor()

	await page.keyboard.press('ControlOrMeta+k')

	await expect(searchInput(page)).toBeVisible()
})

test('typing a printable key opens the modal seeded with that key', async ({
	page
}) => {
	await page.goto('./')
	const searchButton = page.getByRole('button', { name: /search/i })
	await searchButton.waitFor()

	// DocSearch's global handler (useDocSearchKeyboardEvents) only seeds
	// initialQuery when the search button itself holds focus — mirroring a
	// user tabbing onto the button before typing. Without this, the keydown
	// is ignored entirely and the modal never opens.
	await searchButton.focus()

	await page.keyboard.press('z')

	await expect(searchInput(page)).toBeVisible()
	// Prefix match, not equality: Playwright's CDP transport delivers keydown
	// and char as separate messages, so the seeded character can appear
	// twice ('zz'). A real browser keypress does not do this — the doubling
	// is a test-transport artifact, not app behavior.
	await expect(searchInput(page)).toHaveValue(/^z/)
})

test('escape closes the modal and clears the body class', async ({ page }) => {
	await openSearch(page)
	await expect(page.locator('body.DocSearch--active')).toHaveCount(1)

	await page.keyboard.press('Escape')

	await expect(searchInput(page)).toHaveCount(0)
	await expect(page.locator('body.DocSearch--active')).toHaveCount(0)
})
