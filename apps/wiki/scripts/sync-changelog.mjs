import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const wikiDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(
	wikiDir,
	'..',
	'..',
	'packages',
	'docusaurus-plugin-pagefind',
	'CHANGELOG.md'
)
const dest = join(wikiDir, 'src', 'pages', 'changelog.md')

mkdirSync(dirname(dest), { recursive: true })
writeFileSync(dest, readFileSync(source, 'utf8').replace(/^#[^\n]*/, '# Changelog'))
