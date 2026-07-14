export interface PagefindSubResult {
	title: string;
	url: string;
	excerpt?: string;
}

export interface PagefindResultData {
	url: string;
	excerpt: string;
	meta: { title: string; [key: string]: string };
	sub_results: PagefindSubResult[];
}

export interface HighlightSegment {
	text: string;
	highlight: boolean;
}

export interface DocSearchHit {
	objectID: string;
	url: string;
	hierarchy: {
		lvl0: string;
		lvl1: string;
		lvl2: string | null;
		lvl3: string | null;
		lvl4: string | null;
		lvl5: string | null;
		lvl6: string | null;
	};
	content: string;
	titleSegments: HighlightSegment[];
	breadcrumbSegments: HighlightSegment[];
	contentSegments: HighlightSegment[];
	type: 'content';
	_snippetResult: {
		content: { value: string; matchLevel: 'full' };
	};
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitHighlight(
	text: string,
	query: string,
): HighlightSegment[] {
	if (!text) return [];
	const terms = query
		.split(/\s+/)
		.filter((t) => t.length > 0)
		.map(escapeRegExp);
	if (terms.length === 0) return [{ text, highlight: false }];

	const pattern = new RegExp(`(${terms.join('|')})`, 'gi');
	const segments: HighlightSegment[] = [];
	let lastIndex = 0;
	for (const match of text.matchAll(pattern)) {
		const start = match.index ?? 0;
		if (start > lastIndex) {
			segments.push({ text: text.slice(lastIndex, start), highlight: false });
		}
		segments.push({ text: match[0], highlight: true });
		lastIndex = start + match[0].length;
	}
	if (lastIndex < text.length) {
		segments.push({ text: text.slice(lastIndex), highlight: false });
	}
	return segments;
}

function stripMarks(text: string): string {
	return text.replace(/<\/?mark>/gi, '');
}

const NULL_HIERARCHY_LEVELS = {
	lvl3: null,
	lvl4: null,
	lvl5: null,
	lvl6: null,
} as const;

function createDocSearchHit(params: {
	objectID: string;
	url: string;
	pageTitle: string;
	subTitle: string | null;
	excerpt: string;
	titleText: string;
	query: string;
}): DocSearchHit {
	const { objectID, url, pageTitle, subTitle, excerpt, titleText, query } =
		params;
	return {
		objectID,
		url,
		hierarchy: {
			lvl0: pageTitle,
			lvl1: pageTitle,
			lvl2: subTitle,
			...NULL_HIERARCHY_LEVELS,
		},
		content: excerpt,
		titleSegments: splitHighlight(titleText, query),
		breadcrumbSegments: subTitle ? splitHighlight(pageTitle, query) : [],
		contentSegments: splitHighlight(stripMarks(excerpt), query),
		type: 'content',
		_snippetResult: {
			content: { value: excerpt, matchLevel: 'full' },
		},
	};
}

export function expandPagefindResult(
	result: PagefindResultData,
	query: string,
): DocSearchHit[] {
	const pageTitle = result.meta.title;

	if (result.sub_results.length > 0) {
		return result.sub_results.map((sub) => {
			const excerpt = sub.excerpt ?? result.excerpt;
			const isPageTitleMatch = sub.title === pageTitle;
			return createDocSearchHit({
				objectID: sub.url,
				url: sub.url,
				pageTitle,
				subTitle: isPageTitleMatch ? null : sub.title,
				excerpt,
				titleText: sub.title,
				query,
			});
		});
	}

	return [
		createDocSearchHit({
			objectID: result.url,
			url: result.url,
			pageTitle,
			subTitle: null,
			excerpt: result.excerpt,
			titleText: pageTitle,
			query,
		}),
	];
}

export function toDocSearchHit(result: PagefindResultData): DocSearchHit {
	return expandPagefindResult(result, '')[0];
}
