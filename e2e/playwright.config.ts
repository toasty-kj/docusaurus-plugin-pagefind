import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	// Start apps/wiki in serve mode before running tests
	webServer: {
		command: 'pnpm --filter wiki serve',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
	},
});
