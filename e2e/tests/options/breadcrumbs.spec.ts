import { expect, test } from '@playwright/test'
import { expectHits, hits } from '../helpers'

test('breadcrumbs: false leaves the page breadcrumbs out of hits', async ({
	page
}) => {
	await expectHits(page, 'zzbreadcrumbtoken')

	await expect(
		hits(page).first().locator('.pagefindHit-breadcrumb')
	).toHaveCount(0)
})
