import { test } from '@playwright/test'
import { expectHits } from '../helpers'

// The positive half of the exclusion pairs in tests/options/. Without these,
// an absence assertion there would pass just as well if the token had never
// been indexable at all.
test('internal pages are indexed when excludeGlobs is unset', async ({
	page
}) => {
	await expectHits(page, 'zzinternaltoken')
})

test('ad regions are indexed when excludeSelectors is unset', async ({
	page
}) => {
	await expectHits(page, 'zzadtoken')
})
