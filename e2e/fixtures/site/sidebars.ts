import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
	docs: [
		'intro',
		'findable',
		'internal/secret',
		'with-ad',
		'translated',
		{
			type: 'category',
			label: 'Fixture Guides',
			items: ['guides/nested']
		}
	]
}

export default sidebars
