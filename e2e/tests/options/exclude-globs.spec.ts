import { test } from '@playwright/test'
import { expectNoHits } from '../helpers'

test('excludeGlobs keeps internal pages out of the index', async ({ page }) => {
	await expectNoHits(page, 'zzinternaltoken')
})
