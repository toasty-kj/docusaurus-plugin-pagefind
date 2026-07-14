import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	__resetForTest,
	buildPagefindJsUrl,
	createPagefindSearch,
} from './PagefindClient';

const PAGEFIND_JS_URL = '/docusaurus-plugin-pagefind/pagefind/pagefind.js';

const mockPagefind = {
	search: vi.fn(async (query: string) => ({
		results: query
			? [
					{
						data: async () => ({
							url: '/docs/x',
							excerpt: 'hit for ' + query,
							meta: { title: 'X' },
							sub_results: [],
						}),
					},
				]
			: [],
	})),
};

describe('createPagefindSearch', () => {
	beforeEach(() => {
		__resetForTest();
		mockPagefind.search.mockClear();
		(globalThis as any).__pagefindLoader = async () => mockPagefind;
	});

	it('accepts Algolia-shaped requests and returns Algolia-shaped responses', async () => {
		const search = createPagefindSearch(PAGEFIND_JS_URL);
		const response = await search({
			requests: [{ indexName: 'x', query: 'foo' }],
		} as any);
		expect(mockPagefind.search).toHaveBeenCalledWith('foo');
		expect(response.results[0].hits).toHaveLength(1);
		expect(response.results[0].hits[0].url).toBe('/docs/x');
		expect(response.results[0].nbHits).toBe(1);
		expect(response.results[0].page).toBe(0);
	});

	it('loads the pagefind module only once across multiple searches', async () => {
		const loader = vi.fn(async () => mockPagefind);
		(globalThis as any).__pagefindLoader = loader;
		const search = createPagefindSearch(PAGEFIND_JS_URL);
		await search({ requests: [{ indexName: 'x', query: 'a' }] } as any);
		await search({ requests: [{ indexName: 'x', query: 'b' }] } as any);
		expect(loader).toHaveBeenCalledTimes(1);
	});

	it('passes the given pagefind.js URL to the loader', async () => {
		const loader = vi.fn(async () => mockPagefind);
		(globalThis as any).__pagefindLoader = loader;
		const search = createPagefindSearch(PAGEFIND_JS_URL);
		await search({ requests: [{ indexName: 'x', query: 'a' }] } as any);
		expect(loader).toHaveBeenCalledWith(PAGEFIND_JS_URL);
	});

	it('returns empty hits when the pagefind module fails to load', async () => {
		(globalThis as any).__pagefindLoader = async () => {
			throw new Error('module not found');
		};
		const search = createPagefindSearch(PAGEFIND_JS_URL);
		const response = await search({
			requests: [{ indexName: 'x', query: 'x' }],
		} as any);
		expect(response.results[0].hits).toEqual([]);
	});
});

describe('buildPagefindJsUrl', () => {
	it('joins a root baseUrl with the default pagefind subdirectory', () => {
		expect(buildPagefindJsUrl('/', 'pagefind')).toBe('/pagefind/pagefind.js');
	});

	it('joins a non-root baseUrl with the default pagefind subdirectory', () => {
		expect(buildPagefindJsUrl('/docusaurus-plugin-pagefind/', 'pagefind')).toBe(
			'/docusaurus-plugin-pagefind/pagefind/pagefind.js',
		);
	});

	it('joins a custom pagefind subdirectory', () => {
		expect(buildPagefindJsUrl('/base/', 'custom-dir')).toBe(
			'/base/custom-dir/pagefind.js',
		);
	});

	it('collapses double slashes when pagefindDir is empty', () => {
		expect(buildPagefindJsUrl('/base/', '')).toBe('/base/pagefind.js');
	});
});
