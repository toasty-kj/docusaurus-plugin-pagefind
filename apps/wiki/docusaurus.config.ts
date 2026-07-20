import type { Config } from '@docusaurus/types'

const config: Config = {
	title: 'docusaurus-plugin-pagefind',
	tagline: 'Fast offline search for Docusaurus powered by Pagefind',
	url: 'https://toasty-kj.github.io',
	baseUrl: '/docusaurus-plugin-pagefind/',
	onBrokenLinks: 'throw',
	markdown: { hooks: { onBrokenMarkdownLinks: 'warn' } },
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

	plugins: [
		[
			'docusaurus-plugin-pagefind',
			{
				excludeSelectors: ['.navbar', 'footer']
			}
		]
	],

	themeConfig: {
		navbar: {
			title: 'docusaurus-plugin-pagefind',
			items: [
				{ to: '/changelog', label: 'Changelog', position: 'right' },
				{
					href: 'https://github.com/toasty-kj/docusaurus-plugin-pagefind',
					label: 'GitHub',
					position: 'right'
				}
			]
		}
	}
}

export default config
