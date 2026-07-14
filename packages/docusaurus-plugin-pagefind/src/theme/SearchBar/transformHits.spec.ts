import { describe, expect, it } from 'vitest';
import {
	expandPagefindResult,
	splitHighlight,
	toDocSearchHit,
} from './transformHits';

const baseResult = {
	url: '/docs/intro',
	excerpt: 'About <mark>pagefind</mark> search',
	meta: { title: 'Introduction' },
	sub_results: [],
};

describe('toDocSearchHit', () => {
	it('maps a Pagefind result to a DocSearch hit', () => {
		const hit = toDocSearchHit(baseResult as any);
		expect(hit.objectID).toBe('/docs/intro');
		expect(hit.url).toBe('/docs/intro');
		expect(hit.hierarchy.lvl1).toBe('Introduction');
		expect(hit.content).toContain('pagefind');
	});
});

describe('expandPagefindResult', () => {
	it('returns one hit for the page when sub_results is empty', () => {
		const hits = expandPagefindResult(baseResult as any, '');
		expect(hits).toHaveLength(1);
		expect(hits[0].hierarchy.lvl2).toBeNull();
		expect(hits[0].breadcrumbSegments).toEqual([]);
	});

	it('expands sub_results into one hit per heading', () => {
		const result = {
			...baseResult,
			sub_results: [
				{ title: 'Installation', url: '/docs/intro#install', excerpt: 'npm i' },
				{ title: 'Config', url: '/docs/intro#config', excerpt: 'configure it' },
			],
		};
		const hits = expandPagefindResult(result as any, '');
		expect(hits).toHaveLength(2);
		expect(hits[0].hierarchy.lvl2).toBe('Installation');
		expect(hits[0].url).toBe('/docs/intro#install');
		expect(hits[0].breadcrumbSegments).toEqual([
			{ text: 'Introduction', highlight: false },
		]);
		expect(hits[1].hierarchy.lvl2).toBe('Config');
	});

	it('treats a sub_result whose title matches the page title as a page-level hit', () => {
		const result = {
			...baseResult,
			sub_results: [
				{ title: 'Introduction', url: '/docs/intro', excerpt: 'About it' },
				{
					title: 'Requirements',
					url: '/docs/intro#requirements',
					excerpt: 'need node',
				},
			],
		};
		const hits = expandPagefindResult(result as any, '');
		expect(hits[0].hierarchy.lvl2).toBeNull();
		expect(hits[0].breadcrumbSegments).toEqual([]);
		expect(hits[1].hierarchy.lvl2).toBe('Requirements');
	});

	it('highlights matching terms in titleSegments', () => {
		const hits = expandPagefindResult(baseResult as any, 'Intro');
		expect(hits[0].titleSegments).toEqual([
			{ text: 'Intro', highlight: true },
			{ text: 'duction', highlight: false },
		]);
	});
});

describe('splitHighlight', () => {
	it('returns empty array for empty text', () => {
		expect(splitHighlight('', 'foo')).toEqual([]);
	});

	it('returns single non-highlighted segment for empty query', () => {
		expect(splitHighlight('hello', '')).toEqual([
			{ text: 'hello', highlight: false },
		]);
	});

	it('highlights matched word case-insensitively', () => {
		expect(splitHighlight('Hello World', 'world')).toEqual([
			{ text: 'Hello ', highlight: false },
			{ text: 'World', highlight: true },
		]);
	});

	it('highlights multiple query terms', () => {
		expect(splitHighlight('foo bar baz', 'foo baz')).toEqual([
			{ text: 'foo', highlight: true },
			{ text: ' bar ', highlight: false },
			{ text: 'baz', highlight: true },
		]);
	});

	it('treats regex metacharacters as literals', () => {
		expect(splitHighlight('a.b', '.')).toEqual([
			{ text: 'a', highlight: false },
			{ text: '.', highlight: true },
			{ text: 'b', highlight: false },
		]);
	});
});
