const BREADCRUMB_NAV =
	/<nav\b[^>]*\btheme-doc-breadcrumbs\b[^>]*>([\s\S]*?)<\/nav>/i
const EXISTING_META = /data-pagefind-meta=["']?[^"'>]*\bbreadcrumb\s*:/i
const ACTIVE_ITEM = /^[^>]*\bbreadcrumbs__item--active\b/i

export const BREADCRUMB_SEPARATOR = ' › '

const ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' '
}

function decodeEntities(text: string): string {
	return text.replace(
		/&(#x[\da-f]+|#\d+|[a-z]+);/gi,
		(entity, code: string) => {
			if (code[0] === '#') {
				const isHex = code[1].toLowerCase() === 'x'
				return String.fromCodePoint(
					Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10)
				)
			}
			return ENTITIES[code.toLowerCase()] ?? entity
		}
	)
}

/**
 * The labels of the Docusaurus breadcrumbs of a page, without the home icon
 * and the current page, e.g. "Guides › Deployment". Minified builds omit the
 * closing </li> tags, so the items are split at their opening tags.
 */
export function extractBreadcrumb(html: string): string {
	const nav = html.match(BREADCRUMB_NAV)
	if (!nav) return ''
	return nav[1]
		.split(/<li\b/i)
		.slice(1)
		.filter((item) => !ACTIVE_ITEM.test(item))
		.map((item) =>
			decodeEntities(item.slice(item.indexOf('>') + 1).replace(/<[^>]*>/g, ''))
				.replace(/\s+/g, ' ')
				.trim()
		)
		.filter(Boolean)
		.join(BREADCRUMB_SEPARATOR)
}

/**
 * Adds the breadcrumbs of a Docusaurus page as Pagefind `breadcrumb` metadata,
 * next to the breadcrumbs (which are excluded from the indexed content), so that
 * it is inside the indexed root element. Pages that set the metadata
 * themselves are left unchanged.
 */
export function addBreadcrumbMeta(html: string): string {
	if (EXISTING_META.test(html)) return html
	const nav = html.match(BREADCRUMB_NAV)
	const breadcrumb = extractBreadcrumb(html)
	if (!nav || nav.index === undefined || !breadcrumb) return html
	const value = breadcrumb.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
	const meta = `<span data-pagefind-meta="breadcrumb:${value}" hidden></span>`
	return html.slice(0, nav.index) + meta + html.slice(nav.index)
}
