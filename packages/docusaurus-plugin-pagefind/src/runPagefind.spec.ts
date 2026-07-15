import { describe, expect, it, vi } from 'vitest'
import {
	buildIndexConfig,
	type PagefindIndex,
	type PagefindNodeApi,
	resolveOutputPath,
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

	it('ignores outputPath (handled by resolveOutputPath, not the index)', () => {
		expect(buildIndexConfig({ outputPath: '/custom' })).toEqual({})
	})
})

describe('resolveOutputPath', () => {
	it('defaults to <outDir>/pagefind', () => {
		expect(resolveOutputPath('/tmp/out', {})).toBe('/tmp/out/pagefind')
	})

	it('uses a custom outputPath when provided', () => {
		expect(resolveOutputPath('/tmp/out', { outputPath: '/custom/path' })).toBe(
			'/custom/path'
		)
	})
})

function createFakeApi(overrides: Partial<PagefindIndex> = {}): {
	api: PagefindNodeApi
	index: PagefindIndex
	close: ReturnType<typeof vi.fn>
} {
	const index: PagefindIndex = {
		addDirectory: vi.fn().mockResolvedValue({ errors: [], page_count: 3 }),
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
	it('creates the index, adds the outDir and writes to the resolved path', async () => {
		const { api, index, close } = createFakeApi()
		await runPagefind('/tmp/out', { forceLanguage: 'ja' }, async () => api)

		expect(api.createIndex).toHaveBeenCalledWith({ forceLanguage: 'ja' })
		expect(index.addDirectory).toHaveBeenCalledWith({ path: '/tmp/out' })
		expect(index.writeFiles).toHaveBeenCalledWith({
			outputPath: '/tmp/out/pagefind'
		})
		expect(close).toHaveBeenCalledTimes(1)
	})

	it('throws and still closes when indexing reports errors', async () => {
		const { api, close } = createFakeApi({
			addDirectory: vi
				.fn()
				.mockResolvedValue({ errors: ['bad html'], page_count: 0 })
		})

		await expect(runPagefind('/tmp/out', {}, async () => api)).rejects.toThrow(
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

		await expect(runPagefind('/tmp/out', {}, async () => api)).rejects.toThrow(
			/index creation failed[\s\S]*boom/
		)
	})
})
