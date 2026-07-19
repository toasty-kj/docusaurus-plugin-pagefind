import { expect, type Locator, type Page } from '@playwright/test'

const SEARCH_TIMEOUT = 15_000

/** A token present in the fixture site under every variant. */
export const CONTROL_TOKEN = 'zzsearchtoken'

export function hits(page: Page): Locator {
	return page.locator('.pagefindHit')
}

export function searchInput(page: Page): Locator {
	return page.getByPlaceholder(/search/i)
}

export async function openSearch(page: Page): Promise<void> {
	await page.goto('./')
	await page.getByRole('button', { name: /search/i }).click()
	await expect(searchInput(page)).toBeVisible()
}

export async function searchFor(page: Page, query: string): Promise<void> {
	await openSearch(page)
	await searchInput(page).fill(query)
}

/**
 * Asserts `query` returns nothing. The control search runs first so that a
 * zero result count proves the token is excluded from the index, rather than
 * proving the index never loaded — a bug that would otherwise make every
 * exclusion test pass.
 */
export async function expectNoHits(page: Page, query: string): Promise<void> {
	await searchFor(page, CONTROL_TOKEN)
	await expect(hits(page).first()).toBeVisible({ timeout: SEARCH_TIMEOUT })

	await searchInput(page).fill(query)
	await expect(page.locator('.DocSearch-NoResults')).toBeVisible({
		timeout: SEARCH_TIMEOUT
	})
	await expect(hits(page)).toHaveCount(0)
}

export async function expectHits(page: Page, query: string): Promise<void> {
	await searchFor(page, query)
	await expect(hits(page).first()).toBeVisible({ timeout: SEARCH_TIMEOUT })
}
