import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import type { LoadContext, Plugin } from '@docusaurus/types'
import { type PluginOptions, resolveOptions } from './options'

const execFileAsync = promisify(execFile)

export default function pluginPagefind(
	_context: LoadContext,
	options: PluginOptions = {}
): Plugin<void> {
	const mergedOptions = resolveOptions(options)

	return {
		name: 'docusaurus-plugin-pagefind',

		getThemePath() {
			// dist/theme/ — compiled JS consumed by webpack
			return path.resolve(__dirname, './theme')
		},

		getTypeScriptThemePath() {
			// src/theme/ — TypeScript source for swizzling only, NOT processed by webpack
			return path.resolve(__dirname, '../src/theme')
		},

		// The theme loads pagefind.js with import(/* webpackIgnore: true */ url).
		// Docusaurus v3's server-side Babel preset rewrites that import() into
		// require(), detaching the magic comment, so the server compile warns
		// about an expression dependency. The code only runs in the browser, so
		// the warning is noise. Rspack + SWC (the Docusaurus v4 default) keeps
		// the import() as is and never warns.
		configureWebpack(_config, isServer) {
			if (!isServer) return {}
			return {
				ignoreWarnings: [
					{
						module: /SearchBar[\\/]PagefindClient\.js$/,
						message:
							/Critical dependency: the request of a dependency is an expression/
					}
				]
			}
		},

		async postBuild({ outDir }) {
			// The ESM-only pagefind package cannot be import()ed from plugin code:
			// Docusaurus loads plugins through jiti, whose CJS transform/sandbox
			// breaks both plain dynamic import() and the new-Function escape hatch.
			// Run the indexing step in a plain Node child process instead, where
			// native import() just works (see pagefindWorker.mts).
			await execFileAsync(process.execPath, [
				path.join(__dirname, 'pagefindWorker.mjs'),
				JSON.stringify({ outDir, options: mergedOptions })
			])
		}
	}
}

export type { PluginOptions } from './options'
