import { expect, test } from '@playwright/test'
import { CONTROL_TOKEN, expectHits, hits } from '../helpers'

// The regression this suite was built for: under a non-root baseUrl the
// runtime import resolved to the wrong path and was served as HTML, so the
// search silently returned nothing.
test('pagefind.js is served as JavaScript from a baseUrl-aware path', async ({
	page
}) => {
	const pagefindRequest = page.waitForResponse((response) =>
		response.url().endsWith('/pagefind/pagefind.js')
	)

	await page.goto('./')
	await page.getByRole('button', { name: /search/i }).click()
	await page.getByPlaceholder(/search/i).fill(CONTROL_TOKEN)

	const response = await pagefindRequest
	expect(response.status()).toBe(200)
	expect(response.headers()['content-type']).toMatch(/javascript/)
})

test('clicking a hit navigates without dropping the baseUrl', async ({
	page,
	baseURL
}) => {
	await expectHits(page, CONTROL_TOKEN)

	await hits(page).first().click()

	await expect(page).toHaveURL(new RegExp(`^${baseURL!}`))
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		/findable/i
	)
})
