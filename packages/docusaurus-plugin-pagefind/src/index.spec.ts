import { describe, expect, it, vi } from 'vitest'

// postBuild runs the pagefind indexing step in a child process (see
// pagefindWorker.mts); mock execFile so tests never spawn a real one.
vi.mock('node:child_process', () => ({
	execFile: vi.fn(
		(
			_file: string,
			_args: readonly string[],
			callback: (err: Error | null, stdout: string, stderr: string) => void
		) => {
			callback(null, '', '')
		}
	)
}))

import { execFile } from 'node:child_process'
import pluginPagefind from './index'

function createContext(outDir: string, baseUrl: string): any {
	return { outDir, siteConfig: { baseUrl } }
}

/**
 * Invokes the plugin's externals matcher function directly with a given
 * import request, returning whatever it passed to its callback. The
 * matcher in index.ts calls its callback synchronously, so no Promise
 * wrapping is needed.
 */
function matchExternal(
	plugin: ReturnType<typeof pluginPagefind>,
	request: string
): string | undefined {
	const config = plugin.configureWebpack?.(
		undefined as any,
		false,
		undefined as any,
		undefined as any
	)
	const matcher = (config as any).externals[0]
	let captured: string | undefined
	matcher({ request }, (_err: unknown, result?: string) => {
		captured = result
	})
	return captured
}

describe('pluginPagefind', () => {
	it('substitutes the pagefind.js URL for a root baseUrl unchanged from today', () => {
		const plugin = pluginPagefind(createContext('/tmp/out', '/'), {})
		expect(matchExternal(plugin, '/pagefind/pagefind.js')).toBe(
			'promise import("/pagefind/pagefind.js")'
		)
	})

	it('substitutes a baseUrl-prefixed pagefind.js URL for a non-root baseUrl', () => {
		const plugin = pluginPagefind(
			createContext('/tmp/out', '/docusaurus-plugin-pagefind/'),
			{}
		)
		expect(matchExternal(plugin, '/pagefind/pagefind.js')).toBe(
			'promise import("/docusaurus-plugin-pagefind/pagefind/pagefind.js")'
		)
	})

	it('leaves unrelated requests alone (no callback substitution)', () => {
		const plugin = pluginPagefind(createContext('/tmp/out', '/'), {})
		expect(matchExternal(plugin, 'react')).toBeUndefined()
	})

	it('runs the pagefind worker during postBuild without warning', async () => {
		const plugin = pluginPagefind(createContext('/tmp/out', '/'), {})
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		await plugin.postBuild?.({ outDir: '/tmp/out' } as any)
		expect(warnSpy).not.toHaveBeenCalled()
		expect(execFile).toHaveBeenCalledWith(
			process.execPath,
			[expect.stringContaining('pagefindWorker.mjs'), expect.any(String)],
			expect.any(Function)
		)
		warnSpy.mockRestore()
	})
})
