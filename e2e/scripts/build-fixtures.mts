import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { variants } from '../fixtures/variants.ts'

// Builds every fixture variant sequentially, before `playwright test` runs
// (wired up via the root `test:e2e` script). This cannot live in Playwright's
// globalSetup or in the webServer commands: webServers start before
// globalSetup and in parallel, and concurrent `docusaurus build` runs of the
// same site dir race on the shared .docusaurus/ dir and webpack cache. The
// webServer entries in playwright.config.ts only serve the output built here.
const repoRoot = path.resolve(import.meta.dirname, '../..')

// Docusaurus v4 emits its CommonJS SSR bundle chunks under
// <outDir>/__server and require()s them during SSG. e2e/package.json declares
// "type": "module", so without a nearer package.json Node would load those
// chunks as ESM and every page would render Docusaurus's error fallback.
const buildsDir = path.resolve(import.meta.dirname, '../.builds')
mkdirSync(buildsDir, { recursive: true })
writeFileSync(
	path.join(buildsDir, 'package.json'),
	`${JSON.stringify({ type: 'commonjs' }, null, '\t')}\n`
)

for (const variant of variants) {
	console.log(`[build-fixtures] building variant: ${variant.name}`)
	execSync(
		`pnpm --filter @fixtures/site exec docusaurus build --out-dir ../../.builds/${variant.name}`,
		{
			stdio: 'inherit',
			cwd: repoRoot,
			env: { ...process.env, FIXTURE_VARIANT: variant.name }
		}
	)
}
