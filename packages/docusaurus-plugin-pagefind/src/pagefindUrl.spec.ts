import { describe, expect, it } from 'vitest'
import { buildPagefindJsUrl } from './pagefindUrl'

describe('buildPagefindJsUrl', () => {
	it('joins a root baseUrl with the pagefind subdirectory', () => {
		expect(buildPagefindJsUrl('/')).toBe('/pagefind/pagefind.js')
	})

	it('joins a non-root baseUrl with the pagefind subdirectory', () => {
		expect(buildPagefindJsUrl('/docusaurus-plugin-pagefind/')).toBe(
			'/docusaurus-plugin-pagefind/pagefind/pagefind.js'
		)
	})

	it('joins a baseUrl that has no trailing slash', () => {
		expect(buildPagefindJsUrl('/base')).toBe('/base/pagefind/pagefind.js')
	})

	it('collapses the doubled slash produced by a trailing-slash baseUrl', () => {
		expect(buildPagefindJsUrl('/base/')).toBe('/base/pagefind/pagefind.js')
	})
})
