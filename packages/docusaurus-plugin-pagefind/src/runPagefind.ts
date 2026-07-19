import path from 'node:path'
import type { PluginOptions } from './options'

export interface PagefindIndexConfig {
	rootSelector?: string
	excludeSelectors?: string[]
	forceLanguage?: string
}

export interface PagefindIndex {
	addDirectory(options: {
		path: string
		glob?: string
	}): Promise<{ errors: string[]; page_count: number }>
	writeFiles(options: { outputPath: string }): Promise<{ errors: string[] }>
}

export interface PagefindNodeApi {
	createIndex(
		config?: PagefindIndexConfig
	): Promise<{ errors: string[]; index: PagefindIndex }>
	close(): Promise<void>
}

/** Maps plugin options to a Pagefind `createIndex` config. Pure/testable. */
export function buildIndexConfig(options: PluginOptions): PagefindIndexConfig {
	const config: PagefindIndexConfig = {}
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
	return import('pagefind') as unknown as Promise<PagefindNodeApi>
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
			outputPath: path.join(outDir, 'pagefind')
		})
		assertNoErrors('writing index files', writeErrors)
	} finally {
		await pagefind.close()
	}
}
