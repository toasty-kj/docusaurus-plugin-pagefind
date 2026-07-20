import { test } from '@playwright/test'
import { expectNoHits } from '../helpers'

test('rootSelector confines indexing to main', async ({ page }) => {
	await expectNoHits(page, 'zzchrometoken')
})
