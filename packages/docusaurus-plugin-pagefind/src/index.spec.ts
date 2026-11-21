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

function configureWebpack(isServer: boolean): any {
	const plugin = pluginPagefind(createContext('/tmp/out', '/'), {})
	return plugin.configureWebpack?.(
		{} as any,
		isServer,
		undefined as any,
		undefined as any
	)
}

describe('pluginPagefind', () => {
	it('adds nothing to the client bundler config', () => {
		expect(configureWebpack(false)).toEqual({})
	})

	it('ignores only the expression-dependency warning from PagefindClient on the server', () => {
		const [rule] = configureWebpack(true).ignoreWarnings
		expect(rule.module.test('/x/dist/theme/SearchBar/PagefindClient.js')).toBe(
			true
		)
		expect(rule.module.test('/x/dist/theme/SearchBar/index.js')).toBe(false)
		expect(
			rule.message.test(
				'Critical dependency: the request of a dependency is an expression'
			)
		).toBe(true)
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
