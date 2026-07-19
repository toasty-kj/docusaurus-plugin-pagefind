import { defineConfig, devices } from '@playwright/test'
import { type Variant, variants, variantUrl } from './fixtures/variants'

const SITE = 'pnpm --filter @fixtures/site exec'

// Variants are prebuilt into e2e/.builds/<name> by scripts/build-fixtures.mts
// (run via `pnpm test:e2e`) — building here would race, because webServers
// start in parallel and share the fixture site's .docusaurus dir. Each
// webServer only serves its prebuilt output with docusaurus serve (correct
// baseUrl + JS mime type, which a naive static server would get wrong — the
// original bug was an HTML mime on the runtime import).
function serveVariant(variant: Variant): string {
	return (
		`FIXTURE_VARIANT=${variant.name} ${SITE} docusaurus serve ` +
		`--dir ../../.builds/${variant.name} --port ${variant.port} --no-open`
	)
}

// One Playwright project per variant: every spec runs against every variant,
// with the variant's URL as baseURL so specs need no server knowledge.
export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: 'html',
	use: { trace: 'on-first-retry' },
	projects: variants.map((variant) => ({
		name: variant.name,
		use: { ...devices['Desktop Chrome'], baseURL: variantUrl(variant) }
	})),
	webServer: variants.map((variant) => ({
		command: serveVariant(variant),
		url: variantUrl(variant),
		reuseExistingServer: !process.env.CI,
		timeout: 30_000
	}))
})
