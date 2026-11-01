import { expect, test } from '@playwright/test'
import { expectHits, hits } from '../helpers'

// The positive half of tests/options/breadcrumbs.spec.ts.
test('a page hit shows the breadcrumbs of its page', async ({ page }) => {
	await expectHits(page, 'zzbreadcrumbtoken')

	await expect(
		hits(page).first().locator('.pagefindHit-breadcrumb')
	).toHaveText('Fixture Guides')
})

test('a section hit shows the breadcrumbs of its page and the page', async ({
	page
}) => {
	await expectHits(page, 'zznestedsectiontoken')

	await expect(
		hits(page).first().locator('.pagefindHit-breadcrumb')
	).toHaveText('Fixture Guides › Nested Page')
})
