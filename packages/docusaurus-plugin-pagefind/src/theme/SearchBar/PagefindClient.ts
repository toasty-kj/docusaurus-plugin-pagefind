import {
	type DocSearchHit,
	expandPagefindResult,
	type PagefindResultData
} from './transformHits'

interface PagefindModule {
	search(
		query: string
	): Promise<{ results: Array<{ data: () => Promise<PagefindResultData> }> }>
}

interface AlgoliaSearchRequest {
	requests: Array<{ indexName: string; query?: string; params?: string }>
}

interface AlgoliaSearchResponseItem {
	hits: DocSearchHit[]
	nbHits: number
	page: number
	nbPages: number
	hitsPerPage: number
	query: string
	params: string
	index: string
	processingTimeMS: number
}

interface AlgoliaSearchResponse {
	results: AlgoliaSearchResponseItem[]
}

let pagefindPromise: Promise<PagefindModule | null> | null = null

/**
 * Hides the dynamic import inside `Function` so webpack never statically
 * analyzes or bundles it — the same technique runPagefind.ts uses for the
 * Node-side `import('pagefind')`. The specifier is a fully dynamic,
 * baseUrl-aware URL resolved only at runtime in the browser.
 */
const importPagefindModule = new Function(
	'specifier',
	'return import(specifier)',
) as (specifier: string) => Promise<PagefindModule>;

function defaultLoader(pagefindJsUrl: string): Promise<PagefindModule> {
	return importPagefindModule(pagefindJsUrl);
}

async function loadPagefind(
	pagefindJsUrl: string,
): Promise<PagefindModule | null> {
	if (pagefindPromise) return pagefindPromise;
	const loader = (globalThis as any).__pagefindLoader ?? defaultLoader;
	pagefindPromise = loader(pagefindJsUrl).catch(() => null);
	return pagefindPromise;
}

const MAX_PAGES = 8
const MAX_HITS = 20

function buildResponseItem(
	query: string,
	indexName: string,
	hits: DocSearchHit[] = []
): AlgoliaSearchResponseItem {
	return {
		hits,
		nbHits: hits.length,
		page: 0,
		nbPages: hits.length > 0 ? 1 : 0,
		hitsPerPage: MAX_HITS,
		query,
		params: '',
		index: indexName,
		processingTimeMS: 0
	}
}

/**
 * Joins a Docusaurus `baseUrl` and the resolved pagefind subdirectory into
 * the runtime URL for `pagefind.js`, collapsing any doubled slashes.
 */
export function buildPagefindJsUrl(
	baseUrl: string,
	pagefindDir: string,
): string {
	return `${baseUrl}/${pagefindDir}/pagefind.js`.replace(/\/{2,}/g, '/');
}

export function createPagefindSearch(pagefindJsUrl: string) {
	return async function search(
		req: AlgoliaSearchRequest
	): Promise<AlgoliaSearchResponse> {
		const first = req.requests[0];
		const query = first?.query ?? '';
		const indexName = first?.indexName ?? 'pagefind';
		const pf = await loadPagefind(pagefindJsUrl);
		if (!pf || !query) {
			return { results: [buildResponseItem(query, indexName)] }
		}
		const result = await pf.search(query)
		const sliced = result.results.slice(0, MAX_PAGES)
		const data = await Promise.all(sliced.map((r) => r.data()))
		const hits = data
			.flatMap((d) => expandPagefindResult(d, query))
			.slice(0, MAX_HITS)
		return { results: [buildResponseItem(query, indexName, hits)] }
	}
}

export function __resetForTest(): void {
	pagefindPromise = null
}
