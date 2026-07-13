import type { Config } from '@docusaurus/types';

const config: Config = {
	title: 'docusaurus-plugin-pagefind',
	tagline: 'Fast offline search for Docusaurus powered by Pagefind',
	url: 'https://toasty-kj.github.io',
	baseUrl: '/',
	onBrokenLinks: 'throw',
	markdown: { hooks: { onBrokenMarkdownLinks: 'warn' } },
	i18n: { defaultLocale: 'en', locales: ['en'] },

	presets: [
		[
			'classic',
			{
				docs: { sidebarPath: './sidebars.ts', routeBasePath: '/' },
				blog: false,
				theme: {},
			},
		],
	],

	plugins: [
		[
			'docusaurus-plugin-pagefind',
			{
				excludeSelectors: ['.navbar', 'footer'],
			},
		],
	],

	themeConfig: {
		navbar: {
			title: 'docusaurus-plugin-pagefind',
			items: [
				{
					href: 'https://github.com/toasty-kj/docusaurus-plugin-pagefind',
					label: 'GitHub',
					position: 'right',
				},
			],
		},
	},
};

export default config;
