export interface PluginOptions {
	forceLanguage?: string
	excludeSelectors?: string[]
	rootSelector?: string
	excludeGlobs?: string[]
}

/**
 * Selectors for Docusaurus chrome that should never be indexed (navbar,
 * footer, sidebar, breadcrumbs, collapsible ToC) plus Pagefind's own opt-out
 * attribute. These are always applied; user-supplied `excludeSelectors` are
 * added on top rather than replacing them.
 */
export const DEFAULT_EXCLUDE_SELECTORS: readonly string[] = [
	'.navbar',
	'footer',
	'nav.theme-doc-breadcrumbs',
	'.theme-doc-sidebar-container',
	'.tocCollapsible',
	'[data-pagefind-ignore]'
]

/**
 * Merges user options with defaults. `excludeSelectors` is additive: the
 * curated defaults are always kept and user selectors are unioned in (deduped,
 * defaults first), so passing a custom list never silently drops the chrome
 * exclusions.
 */
export function resolveOptions(options: PluginOptions = {}): PluginOptions {
	const excludeSelectors = Array.from(
		new Set([...DEFAULT_EXCLUDE_SELECTORS, ...(options.excludeSelectors ?? [])])
	)
	return { ...options, excludeSelectors }
}
