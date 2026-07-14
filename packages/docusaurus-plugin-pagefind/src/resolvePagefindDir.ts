import path from 'node:path';
import type { PluginOptions } from './options';
import { resolveOutputPath } from './runPagefind';

export interface PagefindDirResult {
	pagefindDir: string;
	warning?: string;
}

/**
 * Resolves the pagefind output directory relative to `outDir`, for exposing
 * to the client as the base of the runtime `pagefind.js` URL. Falls back to
 * the default 'pagefind' subdirectory (with a warning) when a custom
 * `outputPath` writes outside `outDir`, since no reliable browser-fetchable
 * URL can be derived in that case.
 */
export function resolvePagefindDir(
	outDir: string,
	options: PluginOptions,
): PagefindDirResult {
	const resolvedOutputPath = resolveOutputPath(outDir, options);
	const relative = path.relative(outDir, resolvedOutputPath);
	const escapesOutDir = relative.startsWith('..') || path.isAbsolute(relative);

	if (escapesOutDir) {
		return {
			pagefindDir: 'pagefind',
			warning:
				`docusaurus-plugin-pagefind: outputPath "${options.outputPath}" resolves ` +
				`outside the build output directory ("${outDir}"). Client-side search ` +
				'may not be able to locate the Pagefind index automatically at runtime; ' +
				`make sure it is served at "${outDir}/pagefind", or serve the custom ` +
				'location yourself.',
		};
	}

	return { pagefindDir: relative.split(path.sep).join('/') };
}
