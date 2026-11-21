import { expect, test } from '@playwright/test'
import { CONTROL_TOKEN, expectHits, hits, searchFor } from '../helpers'

test('a nonexistent term renders the empty state', async ({ page }) => {
	await searchFor(page, 'zznosuchtokenanywhere')

	await expect(page.locator('.DocSearch-NoResults')).toBeVisible({
		timeout: 15_000
	})
	await expect(hits(page)).toHaveCount(0)
})

test('the query term is highlighted in results', async ({ page }) => {
	await expectHits(page, CONTROL_TOKEN)

	await expect(hits(page).first().locator('mark').first()).toContainText(
		new RegExp(CONTROL_TOKEN, 'i')
	)
})

test('the selected hit keeps the mark color for the query term', async ({
	page
}) => {
	await expectHits(page, CONTROL_TOKEN)

	const mark = page.locator('.DocSearch-Hit[aria-selected="true"] mark').first()
	await expect(mark).toBeVisible()
	const { actual, expected } = await mark.evaluate((el) => {
		const probe = document.createElement('span')
		probe.style.color = 'var(--pagefind-mark)'
		el.after(probe)
		const expected = getComputedStyle(probe).color
		probe.remove()
		return { actual: getComputedStyle(el).color, expected }
	})
	expect(actual).toBe(expected)
})

test('clicking a section hit navigates to its anchor', async ({ page }) => {
	await expectHits(page, 'zzsectiontoken')

	await hits(page).first().click()

	await expect(page).toHaveURL(/#findable-section/)
	await expect(
		page.getByRole('heading', { name: /findable section/i })
	).toBeInViewport()
})
