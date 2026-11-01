import { promises as fs } from 'node:fs'
import path from 'node:path'
import { expect, type Locator, type Page } from '@playwright/test'

const SEARCH_TIMEOUT = 15_000

/** A token present in the fixture site under every variant. */
export const CONTROL_TOKEN = 'zzsearchtoken'

interface PagefindEntry {
	languages: Record<string, unknown>
}

/** Reads the `pagefind-entry.json` build artifact for the named variant. */
export async function readPagefindEntry(
	variantName: string
): Promise<PagefindEntry> {
	const entryPath = path.resolve(
		import.meta.dirname,
		'../.builds',
		variantName,
		'pagefind/pagefind-entry.json'
	)
	return JSON.parse(await fs.readFile(entryPath, 'utf8'))
}

export function hits(page: Page): Locator {
	return page.locator('.pagefindHit')
}

export function searchInput(page: Page): Locator {
	return page.getByPlaceholder(/search/i)
}

/**
 * Navigates and waits for React hydration. The search button is in the SSR
 * HTML, so it is visible before its click handler and DocSearch's keydown
 * listener are attached; interacting earlier is silently ignored. Docusaurus
 * sets the attribute from a root effect, which runs after every child effect.
 */
export async function gotoHydrated(page: Page, url = './'): Promise<void> {
	await page.goto(url)
	await expect(page.locator('html')).toHaveAttribute(
		'data-has-hydrated',
		'true'
	)
}

export async function openSearch(page: Page): Promise<void> {
	await gotoHydrated(page)
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
