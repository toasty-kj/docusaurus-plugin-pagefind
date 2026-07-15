import { defineConfig, devices } from '@playwright/test';

const SITE = 'pnpm --filter @fixtures/site exec';

// Each webServer builds its variant into e2e/.builds/<name> then serves it with
// docusaurus serve (correct baseUrl + JS mime type, which a naive static server
// would get wrong — the original bug was an HTML mime on the runtime import).
function buildAndServe(variant: string, port: number): string {
	return (
		`FIXTURE_VARIANT=${variant} ${SITE} sh -c ` +
		`"docusaurus build --out-dir ../../.builds/${variant} && ` +
		`docusaurus serve --dir ../../.builds/${variant} --port ${port} --no-open"`
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
			command: buildAndServe('root-baseurl', 3100),
			url: 'http://localhost:3100/',
			reuseExistingServer: !process.env.CI,
			timeout: 180_000,
		},
		{
			command: buildAndServe('non-root-baseurl', 3101),
			url: 'http://localhost:3101/fixture-base/',
			reuseExistingServer: !process.env.CI,
			timeout: 180_000,
		},
	],
});
