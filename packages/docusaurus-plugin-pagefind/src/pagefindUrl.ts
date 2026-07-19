/**
 * Builds the runtime URL for `pagefind.js` from a Docusaurus `baseUrl`. The
 * Pagefind index is always written to `<outDir>/pagefind`, so the URL is the
 * `baseUrl` joined with the fixed `pagefind` subdirectory, with any doubled
 * slashes collapsed.
 */
export function buildPagefindJsUrl(baseUrl: string): string {
	return `${baseUrl}/pagefind/pagefind.js`.replace(/\/{2,}/g, '/')
}
