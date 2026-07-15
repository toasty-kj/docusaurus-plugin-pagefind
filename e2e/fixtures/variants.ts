import type { PluginOptions } from 'docusaurus-plugin-pagefind';

export interface Variant {
	name: string;
	baseUrl: string;
	pluginOptions: PluginOptions;
}

// The E2E layer needs only root vs non-root baseUrl. The artifact layer (a
// later branch) extends this array with excludeGlobs/excludeSelectors/outputPath
// variants; keep this as the single source of truth for both.
export const variants: Variant[] = [
	{ name: 'root-baseurl', baseUrl: '/', pluginOptions: {} },
	{ name: 'non-root-baseurl', baseUrl: '/fixture-base/', pluginOptions: {} },
];

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
