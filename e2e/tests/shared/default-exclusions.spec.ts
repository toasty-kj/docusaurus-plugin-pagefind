import { test } from '@playwright/test'
import { expectNoHits } from '../helpers'

// DEFAULT_EXCLUDE_SELECTORS is applied under every configuration, and user
// excludeSelectors are unioned onto it rather than replacing it — so these
// hold on every variant, including options-combined.
test('navbar chrome is never indexed', async ({ page }) => {
	await expectNoHits(page, 'zznavtoken')
})

test('footer chrome is never indexed', async ({ page }) => {
	await expectNoHits(page, 'zzfootertoken')
})
