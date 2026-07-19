import type { PluginOptions } from 'docusaurus-plugin-pagefind'

/**
 * Which builds a spec's assertions hold under. A spec lives in the
 * `e2e/tests/<tier>/` directory matching the tier it is true in, and each
 * variant runs only the tiers it satisfies — so specs never branch on the
 * variant they are running against.
 */
export type Tier = 'shared' | 'no-options' | 'options'

export interface Variant {
	name: string
	baseUrl: string
	/** Port the variant's docusaurus serve listens on during e2e runs. */
	port: number
	pluginOptions: PluginOptions
	tiers: Tier[]
}

export const variants: Variant[] = [
	{
		name: 'root-baseurl',
		baseUrl: '/',
		port: 3100,
		pluginOptions: {},
		tiers: ['shared', 'no-options']
	},
	{
		name: 'non-root-baseurl',
		baseUrl: '/fixture-base/',
		port: 3101,
		pluginOptions: {},
		tiers: ['shared', 'no-options']
	},
	{
		name: 'options-combined',
		baseUrl: '/',
		port: 3102,
		pluginOptions: {
			excludeGlobs: ['internal/**'],
			excludeSelectors: ['.ad-region'],
			rootSelector: 'main',
			forceLanguage: 'en'
		},
		tiers: ['shared', 'options']
	}
]

/** Origin + baseUrl a variant is reachable at during e2e runs. */
export function variantUrl(variant: Variant): string {
	return `http://localhost:${variant.port}${variant.baseUrl}`
}

export function getVariant(name: string | undefined): Variant {
	const variant = variants.find((v) => v.name === name)
	if (!variant) {
		throw new Error(
			`Unknown FIXTURE_VARIANT: ${name ?? '(unset)'}. ` +
				`Known: ${variants.map((v) => v.name).join(', ')}`
		)
	}
	return variant
}
