import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	buildIndexConfig,
	type PagefindIndex,
	type PagefindNodeApi,
	runPagefind
} from './runPagefind'

describe('buildIndexConfig', () => {
	it('is empty for empty options', () => {
		expect(buildIndexConfig({})).toEqual({})
	})

	it('maps rootSelector, excludeSelectors and forceLanguage', () => {
		expect(
			buildIndexConfig({
				rootSelector: 'main',
				excludeSelectors: ['.navbar', 'footer'],
				forceLanguage: 'ja'
			})
		).toEqual({
			rootSelector: 'main',
			excludeSelectors: ['.navbar', 'footer'],
			forceLanguage: 'ja'
		})
	})

	it('omits excludeSelectors when the list is empty', () => {
		expect(buildIndexConfig({ excludeSelectors: [] })).toEqual({})
	})
})

function createFakeApi(overrides: Partial<PagefindIndex> = {}): {
	api: PagefindNodeApi
	index: PagefindIndex
	close: ReturnType<typeof vi.fn>
} {
	const index: PagefindIndex = {
		addHTMLFile: vi.fn().mockResolvedValue({
			errors: [],
			file: { uniqueWords: 0, url: '/', meta: {} }
		}),
		writeFiles: vi.fn().mockResolvedValue({ errors: [] }),
		...overrides
	}
	const close = vi.fn().mockResolvedValue(undefined)
	const api: PagefindNodeApi = {
		createIndex: vi.fn().mockResolvedValue({ errors: [], index }),
		close
	}
	return { api, index, close }
}

describe('runPagefind', () => {
	let outDir: string

	beforeEach(async () => {
		outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pagefind-run-'))
		await fs.mkdir(path.join(outDir, 'guide'), { recursive: true })
		await fs.mkdir(path.join(outDir, 'internal', 'secret'), {
			recursive: true
		})
		await fs.writeFile(
			path.join(outDir, 'guide', 'index.html'),
			'<html><body>guide</body></html>'
		)
		await fs.writeFile(
			path.join(outDir, 'internal', 'secret', 'index.html'),
			'<html><body>zzinternaltoken</body></html>'
		)
	})

	afterEach(async () => {
		await fs.rm(outDir, { recursive: true, force: true })
	})

	it('indexes every html file under outDir when there are no excludeGlobs, and writes to the resolved path', async () => {
		const { api, index, close } = createFakeApi()
		await runPagefind(outDir, { forceLanguage: 'ja' }, async () => api)

		expect(api.createIndex).toHaveBeenCalledWith({ forceLanguage: 'ja' })

		const calls = (index.addHTMLFile as ReturnType<typeof vi.fn>).mock.calls
		const sourcePaths = calls.map(([file]) => file.sourcePath).sort()
		expect(sourcePaths).toEqual(
			[
				path.join('guide', 'index.html'),
				path.join('internal', 'secret', 'index.html')
			].sort()
		)

		const guideCall = calls.find(
			([file]) => file.sourcePath === path.join('guide', 'index.html')
		)
		expect(guideCall?.[0].content).toBe('<html><body>guide</body></html>')

		expect(index.writeFiles).toHaveBeenCalledWith({
			outputPath: path.join(outDir, 'pagefind')
		})
		expect(close).toHaveBeenCalledTimes(1)
	})

	it('filters out files matching excludeGlobs (relative to outDir) and never calls addDirectory', async () => {
		const { api, index } = createFakeApi()
		const addDirectorySpy = vi.fn()
		Object.assign(index, { addDirectory: addDirectorySpy })

		await runPagefind(
			outDir,
			{ excludeGlobs: ['internal/**'] },
			async () => api
		)

		const sourcePaths = (
			index.addHTMLFile as ReturnType<typeof vi.fn>
		).mock.calls.map(([file]) => file.sourcePath)
		expect(sourcePaths).toEqual([path.join('guide', 'index.html')])
		expect(addDirectorySpy).not.toHaveBeenCalled()
	})

	it('passes sourcePath relative to outDir, not absolute', async () => {
		const { api, index } = createFakeApi()
		await runPagefind(outDir, {}, async () => api)

		const sourcePaths = (
			index.addHTMLFile as ReturnType<typeof vi.fn>
		).mock.calls.map(([file]) => file.sourcePath as string)
		expect(sourcePaths.length).toBeGreaterThan(0)
		for (const sourcePath of sourcePaths) {
			expect(path.isAbsolute(sourcePath)).toBe(false)
		}
	})

	it('throws and still closes when indexing reports errors', async () => {
		const { api, close } = createFakeApi({
			addHTMLFile: vi
				.fn()
				.mockResolvedValue({ errors: ['bad html'], file: undefined })
		})

		await expect(runPagefind(outDir, {}, async () => api)).rejects.toThrow(
			/indexing failed[\s\S]*bad html/
		)
		expect(close).toHaveBeenCalledTimes(1)
	})

	it('throws when the index cannot be created', async () => {
		const api: PagefindNodeApi = {
			createIndex: vi
				.fn()
				.mockResolvedValue({ errors: ['boom'], index: undefined }),
			close: vi.fn().mockResolvedValue(undefined)
		} as unknown as PagefindNodeApi

		await expect(runPagefind(outDir, {}, async () => api)).rejects.toThrow(
			/index creation failed[\s\S]*boom/
		)
	})
})
