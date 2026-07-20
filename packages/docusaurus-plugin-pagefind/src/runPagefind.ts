import { promises as fs } from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
// Type-only imports are erased at compile time, so referencing the ESM-only
// `pagefind` package here is safe even though this module is emitted as CJS.
// The package itself is a devDependency purely for these declarations; at
// runtime the consumer's peer-installed copy is loaded via import() below.
import type { PagefindServiceConfig } from 'pagefind'
import type { PluginOptions } from './options'

/**
 * Narrow views of the official pagefind types: derived with `Pick` so they
 * track the upstream API, but limited to what this plugin calls so test
 * fakes stay small.
 */
export type PagefindIndex = Pick<
	import('pagefind').PagefindIndex,
	'addHTMLFile' | 'writeFiles'
>

export type PagefindNodeApi = Pick<
	typeof import('pagefind'),
	'createIndex' | 'close'
>

/** Maps plugin options to a Pagefind `createIndex` config. Pure/testable. */
export function buildIndexConfig(
	options: PluginOptions
): PagefindServiceConfig {
	const config: PagefindServiceConfig = {}
	if (options.rootSelector) {
		config.rootSelector = options.rootSelector
	}
	if (options.excludeSelectors && options.excludeSelectors.length > 0) {
		config.excludeSelectors = options.excludeSelectors
	}
	if (options.forceLanguage) {
		config.forceLanguage = options.forceLanguage
	}
	return config
}

function assertNoErrors(context: string, errors: string[] | undefined): void {
	if (errors && errors.length > 0) {
		throw new Error(`Pagefind ${context} failed:\n${errors.join('\n')}`)
	}
}

/**
 * Pagefind ships an ESM-only Node API. This module only ever runs inside the
 * pagefindWorker child process (plain Node, never jiti), and `module: nodenext`
 * keeps dynamic `import()` as-is in the CJS emit, so the ESM-only package loads
 * natively; the bare specifier resolves against the consumer's peer-installed
 * `pagefind`.
 */
function loadPagefind(): Promise<PagefindNodeApi> {
	return import('pagefind')
}

/**
 * Lists HTML files under `outDir`, relative to it, excluding anything
 * matching `excludeGlobs`. Matched the same way `injectIgnoreMarkers` used to
 * (globs evaluated with `cwd: outDir`), so `internal/**` still matches
 * `internal/secret/index.html`.
 */
function collectHtmlFiles(
	outDir: string,
	excludeGlobs: string[] = []
): Promise<string[]> {
	return fg('**/*.html', {
		cwd: outDir,
		onlyFiles: true,
		ignore: excludeGlobs
	})
}

export async function runPagefind(
	outDir: string,
	options: PluginOptions,
	load: () => Promise<PagefindNodeApi> = loadPagefind
): Promise<void> {
	const pagefind = await load()
	const { errors: createErrors, index } = await pagefind.createIndex(
		buildIndexConfig(options)
	)
	assertNoErrors('index creation', createErrors)
	if (!index) {
		throw new Error('Pagefind did not return an index')
	}
	try {
		// Excluded files are never handed to Pagefind, rather than indexed and
		// marked for it to skip: rootSelector narrows the scanned subtree, and a
		// data-pagefind-ignore marker on <body> falls outside that subtree and
		// is silently missed. Filtering here is correct regardless of what
		// scanning options are in play.
		const files = await collectHtmlFiles(outDir, options.excludeGlobs)
		const addErrors: string[] = []
		for (const sourcePath of files) {
			const content = await fs.readFile(path.join(outDir, sourcePath), 'utf8')
			const { errors } = await index.addHTMLFile({ sourcePath, content })
			addErrors.push(...errors)
		}
		assertNoErrors('indexing', addErrors)
		const { errors: writeErrors } = await index.writeFiles({
			outputPath: path.join(outDir, 'pagefind')
		})
		assertNoErrors('writing index files', writeErrors)
	} finally {
		await pagefind.close()
	}
}
