import path from 'node:path'
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
	'addDirectory' | 'writeFiles'
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

/**
 * Resolves where the Pagefind bundle is written. Preserves the Pagefind CLI
 * default of `<outDir>/pagefind` when no custom `outputPath` is given.
 */
export function resolveOutputPath(
	outDir: string,
	options: PluginOptions
): string {
	return options.outputPath ?? path.join(outDir, 'pagefind')
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
		const { errors: addErrors } = await index.addDirectory({ path: outDir })
		assertNoErrors('indexing', addErrors)
		const { errors: writeErrors } = await index.writeFiles({
			outputPath: resolveOutputPath(outDir, options)
		})
		assertNoErrors('writing index files', writeErrors)
	} finally {
		await pagefind.close()
	}
}
