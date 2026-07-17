import type { PluginOptions } from 'docusaurus-plugin-pagefind';

export interface Variant {
	name: string;
	baseUrl: string;
	/** Port the variant's docusaurus serve listens on during e2e runs. */
	port: number;
	pluginOptions: PluginOptions;
}

// The E2E layer needs only root vs non-root baseUrl. The artifact layer (a
// later branch) extends this array with excludeGlobs/excludeSelectors/outputPath
// variants; keep this as the single source of truth for both. The build script,
// Playwright projects, and webServer entries are all derived from this array.
export const variants: Variant[] = [
	{ name: 'root-baseurl', baseUrl: '/', port: 3100, pluginOptions: {} },
	{
		name: 'non-root-baseurl',
		baseUrl: '/fixture-base/',
		port: 3101,
		pluginOptions: {},
	},
];

/** Origin + baseUrl a variant is reachable at during e2e runs. */
export function variantUrl(variant: Variant): string {
	return `http://localhost:${variant.port}${variant.baseUrl}`;
}

export function getVariant(name: string | undefined): Variant {
	const variant = variants.find((v) => v.name === name);
	if (!variant) {
		throw new Error(
			`Unknown FIXTURE_VARIANT: ${name ?? '(unset)'}. ` +
				`Known: ${variants.map((v) => v.name).join(', ')}`,
		);
	}
	return variant;
}
