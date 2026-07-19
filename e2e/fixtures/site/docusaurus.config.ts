import type { Config } from '@docusaurus/types'
import { getVariant } from '../variants'

const variant = getVariant(process.env.FIXTURE_VARIANT)

const config: Config = {
	title: 'pagefind e2e fixture',
	url: 'https://example.com',
	baseUrl: variant.baseUrl,
	onBrokenLinks: 'throw',
	i18n: { defaultLocale: 'en', locales: ['en'] },
	presets: [
		[
			'classic',
			{
				docs: { sidebarPath: './sidebars.ts', routeBasePath: '/' },
				blog: false,
				theme: {}
			}
		]
	],
	plugins: [['docusaurus-plugin-pagefind', variant.pluginOptions]]
}

export default config
