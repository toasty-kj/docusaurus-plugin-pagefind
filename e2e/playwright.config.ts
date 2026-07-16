import { defineConfig, devices } from '@playwright/test';

const SITE = 'pnpm --filter @fixtures/site exec';

// Variants are prebuilt into e2e/.builds/<name> by scripts/build-fixtures.ts
// (run via `pnpm test:e2e`) — building here would race, because webServers
// start in parallel and share the fixture site's .docusaurus dir. Each
// webServer only serves its prebuilt output with docusaurus serve (correct
// baseUrl + JS mime type, which a naive static server would get wrong — the
// original bug was an HTML mime on the runtime import).
function serveVariant(variant: string, port: number): string {
	return (
		`FIXTURE_VARIANT=${variant} ${SITE} docusaurus serve ` +
		`--dir ../../.builds/${variant} --port ${port} --no-open`
	);
}

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: 'html',
	use: { trace: 'on-first-retry' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: [
		{
			command: serveVariant('root-baseurl', 3100),
			url: 'http://localhost:3100/',
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
		},
		{
			command: serveVariant('non-root-baseurl', 3101),
			url: 'http://localhost:3101/fixture-base/',
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
		},
	],
});
