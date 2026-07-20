import { test } from '@playwright/test'
import { expectHits, expectNoHits } from '../helpers'

test('excludeSelectors keeps the ad region out of the index', async ({
	page
}) => {
	await expectNoHits(page, 'zzadtoken')
})

test('excluding the ad region leaves sibling content indexed', async ({
	page
}) => {
	await expectHits(page, 'zzbodytoken')
})
