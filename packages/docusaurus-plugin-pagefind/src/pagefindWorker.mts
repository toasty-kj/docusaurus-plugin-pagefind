import { runPagefind } from './runPagefind.js'

/**
 * Child-process entry point for the indexing step (.mts → emitted as ESM).
 *
 * Docusaurus loads plugins through jiti, which evaluates them in a CJS
 * sandbox where the ESM-only `pagefind` package cannot be import()ed — so
 * `postBuild` spawns this file with `process.execPath` instead. Here, in a
 * plain Node process, native `import()` just works.
 *
 * Invocation: node pagefindWorker.mjs '<JSON {"outDir": string, "options": PluginOptions}>'
 */
const payload = process.argv[2]
if (!payload) {
	console.error('pagefindWorker: missing JSON payload argument')
	process.exit(1)
}

const { outDir, options } = JSON.parse(payload) as {
	outDir: string
	options: import('./options.js').PluginOptions
}

runPagefind(outDir, options).catch((error: unknown) => {
	console.error(error)
	process.exitCode = 1
})
