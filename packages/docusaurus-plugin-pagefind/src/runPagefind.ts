import path from 'node:path';
import type { PluginOptions } from './options';

/**
 * Pagefind ships an ESM-only Node API. This plugin compiles to CommonJS, and a
 * plain `import('pagefind')` would be downleveled to `require()` by tsc — which
 * throws `ERR_REQUIRE_ESM` on Node < 22.12. Hiding the import behind a Function
 * keeps it a genuine dynamic `import()` in the emitted CJS, and the bare
 * specifier resolves against the consumer's peer-installed `pagefind`.
 */
const importESM = new Function('specifier', 'return import(specifier)') as (
	specifier: string,
) => Promise<unknown>;

export interface PagefindIndexConfig {
	rootSelector?: string;
	excludeSelectors?: string[];
	forceLanguage?: string;
}

export interface PagefindIndex {
	addDirectory(options: {
		path: string;
		glob?: string;
	}): Promise<{ errors: string[]; page_count: number }>;
	writeFiles(options: { outputPath?: string }): Promise<{ errors: string[] }>;
}

export interface PagefindNodeApi {
	createIndex(
		config?: PagefindIndexConfig,
	): Promise<{ errors: string[]; index: PagefindIndex }>;
	close(): Promise<void>;
}

/** Maps plugin options to a Pagefind `createIndex` config. Pure/testable. */
export function buildIndexConfig(options: PluginOptions): PagefindIndexConfig {
	const config: PagefindIndexConfig = {};
	if (options.rootSelector) {
		config.rootSelector = options.rootSelector;
	}
	if (options.excludeSelectors && options.excludeSelectors.length > 0) {
		config.excludeSelectors = options.excludeSelectors;
	}
	if (options.forceLanguage) {
		config.forceLanguage = options.forceLanguage;
	}
	return config;
}

/**
 * Resolves where the Pagefind bundle is written. Preserves the Pagefind CLI
 * default of `<outDir>/pagefind` when no custom `outputPath` is given.
 */
export function resolveOutputPath(
	outDir: string,
	options: PluginOptions,
): string {
	return options.outputPath ?? path.join(outDir, 'pagefind');
}

function assertNoErrors(context: string, errors: string[] | undefined): void {
	if (errors && errors.length > 0) {
		throw new Error(`Pagefind ${context} failed:\n${errors.join('\n')}`);
	}
}

function loadPagefind(): Promise<PagefindNodeApi> {
	return importESM('pagefind') as Promise<PagefindNodeApi>;
}

export async function runPagefind(
	outDir: string,
	options: PluginOptions,
	load: () => Promise<PagefindNodeApi> = loadPagefind,
): Promise<void> {
	const pagefind = await load();
	const { errors: createErrors, index } = await pagefind.createIndex(
		buildIndexConfig(options),
	);
	assertNoErrors('index creation', createErrors);
	if (!index) {
		throw new Error('Pagefind did not return an index');
	}
	try {
		const { errors: addErrors } = await index.addDirectory({ path: outDir });
		assertNoErrors('indexing', addErrors);
		const { errors: writeErrors } = await index.writeFiles({
			outputPath: resolveOutputPath(outDir, options),
		});
		assertNoErrors('writing index files', writeErrors);
	} finally {
		await pagefind.close();
	}
}
