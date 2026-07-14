import {
	type DocSearchHit,
	expandPagefindResult,
	type PagefindResultData,
} from './transformHits';

interface PagefindModule {
	search(
		query: string,
	): Promise<{ results: Array<{ data: () => Promise<PagefindResultData> }> }>;
}

interface AlgoliaSearchRequest {
	requests: Array<{ indexName: string; query?: string; params?: string }>;
}

interface AlgoliaSearchResponseItem {
	hits: DocSearchHit[];
	nbHits: number;
	page: number;
	nbPages: number;
	hitsPerPage: number;
	query: string;
	params: string;
	index: string;
	processingTimeMS: number;
}

interface AlgoliaSearchResponse {
	results: AlgoliaSearchResponseItem[];
}

let pagefindPromise: Promise<PagefindModule | null> | null = null;

function defaultLoader(): Promise<PagefindModule> {
	return import(
		// @ts-expect-error: /pagefind/pagefind.js is a runtime-only path served by Docusaurus build output
		/* webpackIgnore: true */ '/pagefind/pagefind.js'
	) as Promise<PagefindModule>;
}

async function loadPagefind(): Promise<PagefindModule | null> {
	if (pagefindPromise) return pagefindPromise;
	const loader = (globalThis as any).__pagefindLoader ?? defaultLoader;
	pagefindPromise = loader().catch(() => null);
	return pagefindPromise;
}

const MAX_PAGES = 8;
const MAX_HITS = 20;

function buildResponseItem(
	query: string,
	indexName: string,
	hits: DocSearchHit[] = [],
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
		processingTimeMS: 0,
	};
}

export function createPagefindSearch() {
	return async function search(
		req: AlgoliaSearchRequest,
	): Promise<AlgoliaSearchResponse> {
		const first = req.requests[0];
		const query = first?.query ?? '';
		const indexName = first?.indexName ?? 'pagefind';
		const pf = await loadPagefind();
		if (!pf || !query) {
			return { results: [buildResponseItem(query, indexName)] };
		}
		const result = await pf.search(query);
		const sliced = result.results.slice(0, MAX_PAGES);
		const data = await Promise.all(sliced.map((r) => r.data()));
		const hits = data
			.flatMap((d) => expandPagefindResult(d, query))
			.slice(0, MAX_HITS);
		return { results: [buildResponseItem(query, indexName, hits)] };
	};
}

export function __resetForTest(): void {
	pagefindPromise = null;
}
