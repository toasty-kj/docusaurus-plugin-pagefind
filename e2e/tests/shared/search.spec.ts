import { expect, test } from '@playwright/test'
import { CONTROL_TOKEN, expectHits, hits } from '../helpers'

test('search returns a real result', async ({ page }) => {
	await expectHits(page, CONTROL_TOKEN)
	await expect(hits(page).first()).toContainText(/findable/i)
})
