import { describe, expect, it } from 'vitest'
import { addBreadcrumbMeta, extractBreadcrumb } from './breadcrumbMeta'

// as in a minified Docusaurus build: unquoted attributes, no closing </li>
const minifiedNav =
	'<nav class="theme-doc-breadcrumbs breadcrumbsContainer_Alpn" aria-label=Breadcrumbs><ul class=breadcrumbs>' +
	'<li class=breadcrumbs__item><a aria-label="Home page" class=breadcrumbs__link href=/><svg viewBox="0 0 24 24"><path d="M10 19v-5"/></svg></a>' +
	'<li class=breadcrumbs__item><a class=breadcrumbs__link href=/guides><span>Guides</span></a>' +
	'<li class=breadcrumbs__item><span class=breadcrumbs__link>Deployment</span>' +
	'<li class="breadcrumbs__item breadcrumbs__item--active"><span class=breadcrumbs__link>Docker</span></ul></nav>'

const page = (nav: string) =>
	`<html><body><main><article>${nav}<h1>Docker</h1><p>Run it in a container.</p></article></main></body></html>`

describe('extractBreadcrumb', () => {
	it('joins the labels without the home icon and the current page', () => {
		expect(extractBreadcrumb(page(minifiedNav))).toBe('Guides › Deployment')
	})

	it('handles quoted attributes and closing </li> tags', () => {
		const nav =
			'<nav aria-label="Breadcrumbs" class="theme-doc-breadcrumbs"><ul class="breadcrumbs">' +
			'<li class="breadcrumbs__item"><a class="breadcrumbs__link" href="/">Home</a></li>' +
			'<li class="breadcrumbs__item"><span class="breadcrumbs__link">Tutorial &amp; Basics</span></li>' +
			'<li class="breadcrumbs__item breadcrumbs__item--active"><span class="breadcrumbs__link">Intro</span></li>' +
			'</ul></nav>'
		expect(extractBreadcrumb(page(nav))).toBe('Home › Tutorial & Basics')
	})

	it('is empty without breadcrumbs, or with only the current page', () => {
		expect(extractBreadcrumb(page(''))).toBe('')
		const nav =
			'<nav class="theme-doc-breadcrumbs"><ul class=breadcrumbs>' +
			'<li class="breadcrumbs__item breadcrumbs__item--active"><span>Intro</span></ul></nav>'
		expect(extractBreadcrumb(page(nav))).toBe('')
	})
})

describe('addBreadcrumbMeta', () => {
	it('adds the breadcrumb as metadata right before the breadcrumbs', () => {
		const html = addBreadcrumbMeta(page(minifiedNav))
		expect(html).toContain(
			'<article><span data-pagefind-meta="breadcrumb:Guides › Deployment" hidden></span><nav'
		)
	})

	it('escapes the attribute value', () => {
		const nav = minifiedNav.replace('Deployment', 'Say &quot;hi&quot; &amp; go')
		expect(addBreadcrumbMeta(page(nav))).toContain(
			'data-pagefind-meta="breadcrumb:Guides › Say &quot;hi&quot; &amp; go"'
		)
	})

	it('leaves pages without breadcrumbs unchanged', () => {
		expect(addBreadcrumbMeta(page(''))).toBe(page(''))
	})

	it('leaves pages that set the breadcrumb metadata themselves unchanged', () => {
		const html = page(
			`<span hidden data-pagefind-meta="breadcrumb:Custom"></span>${minifiedNav}`
		)
		expect(addBreadcrumbMeta(html)).toBe(html)
	})
})
