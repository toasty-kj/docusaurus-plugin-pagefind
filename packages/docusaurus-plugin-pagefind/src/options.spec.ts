import { describe, expect, it } from 'vitest'
import { DEFAULT_EXCLUDE_SELECTORS, resolveOptions } from './options'

describe('resolveOptions', () => {
	it('applies the default exclude selectors when none are given', () => {
		expect(resolveOptions().excludeSelectors).toEqual([
			...DEFAULT_EXCLUDE_SELECTORS
		])
	})

	it('adds user selectors on top of the defaults instead of replacing them', () => {
		const { excludeSelectors } = resolveOptions({
			excludeSelectors: ['.custom-widget']
		})
		for (const selector of DEFAULT_EXCLUDE_SELECTORS) {
			expect(excludeSelectors).toContain(selector)
		}
		expect(excludeSelectors).toContain('.custom-widget')
	})

	it('deduplicates selectors already present in the defaults', () => {
		const { excludeSelectors } = resolveOptions({
			excludeSelectors: ['footer', '.custom-widget']
		})
		expect(excludeSelectors?.filter((s) => s === 'footer')).toHaveLength(1)
	})

	it('preserves other options untouched', () => {
		const resolved = resolveOptions({
			forceLanguage: 'ja',
			excludeGlobs: ['**/internal/**']
		})
		expect(resolved.forceLanguage).toBe('ja')
		expect(resolved.excludeGlobs).toEqual(['**/internal/**'])
	})
})
