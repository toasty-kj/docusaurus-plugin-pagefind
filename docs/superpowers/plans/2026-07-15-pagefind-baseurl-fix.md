# Pagefind baseUrl Search Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix client-side Pagefind search so it works on sites deployed under a non-root Docusaurus `baseUrl` (e.g. GitHub Pages project sites) and under a custom `outputPath`, both of which currently make search silently return zero results.

**Architecture:** Load the Pagefind runtime through a `new Function('specifier', 'return import(specifier)')` indirection (the same technique `runPagefind.ts` already uses for the Node-side ESM-only `pagefind` import), so webpack never sees or bundles the import and the specifier can be a fully dynamic, runtime-computed URL. That URL is assembled client-side from `useDocusaurusContext()`'s `siteConfig.baseUrl` and a Node-computed "pagefind subdirectory" exposed via Docusaurus's plugin `contentLoaded`/`setGlobalData` → `usePluginData` mechanism. This removes the previous webpack `externals` hack entirely.

**Tech Stack:** TypeScript, Docusaurus plugin/theme APIs (`@docusaurus/types`, `useDocusaurusContext`, `usePluginData`), Vitest, Playwright (`@playwright/test`).

## Global Constraints

- Formatting: tabs for indentation, single quotes for strings (biome.json: `indentStyle: "tab"`, `quoteStyle: "single"`). `.tsx` files are **not** covered by the `lint-staged` `"*.ts"` glob, so match this style by hand.
- Repo `engines.node` is `22.x`; local Node may differ (a pnpm engine warning is expected and harmless — do not attempt to fix it).
- Existing public behavior must not change for root-`baseUrl` sites: default `pagefindDir` resolves to `pagefind`, matching today's fixed path exactly.
- No new runtime dependencies for the plugin package itself (`@docusaurus/module-type-aliases` already ambient-types `useDocusaurusContext`/`usePluginData`).

---

## Background (read before starting)

Verified live: building and serving the `apps/wiki` demo (which sets `baseUrl: '/docusaurus-plugin-pagefind/'`) and searching for "installation" (a page that exists) returns "No results". Root cause: `PagefindClient.ts`, `index.ts`'s webpack `externals`, and `SearchBar/index.tsx`'s preconnect link all hardcode the root-relative path `/pagefind/pagefind.js`, which is wrong whenever `baseUrl !== '/'`. A secondary issue: the runtime path is also wrong whenever the `outputPath` option relocates the generated index. Full design: `docs/superpowers/specs/2026-07-15-pagefind-baseurl-fix-design.md`.

---

### Task 1: `resolvePagefindDir` — compute the pagefind subdirectory from `outDir`/`outputPath`

**Files:**
- Create: `packages/docusaurus-plugin-pagefind/src/resolvePagefindDir.ts`
- Test: `packages/docusaurus-plugin-pagefind/src/resolvePagefindDir.spec.ts`

**Interfaces:**
- Consumes: `resolveOutputPath(outDir: string, options: PluginOptions): string` from `./runPagefind` (existing, unchanged).
- Produces: `resolvePagefindDir(outDir: string, options: PluginOptions): PagefindDirResult` and `interface PagefindDirResult { pagefindDir: string; warning?: string }`. Task 3 imports both.

- [ ] **Step 1: Write the failing test**

Create `packages/docusaurus-plugin-pagefind/src/resolvePagefindDir.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolvePagefindDir } from './resolvePagefindDir';

describe('resolvePagefindDir', () => {
	it('defaults to the "pagefind" subdirectory when outputPath is not set', () => {
		expect(resolvePagefindDir('/tmp/out', {})).toEqual({
			pagefindDir: 'pagefind',
		});
	});

	it('derives the subdirectory when outputPath is inside outDir', () => {
		expect(
			resolvePagefindDir('/tmp/out', { outputPath: '/tmp/out/custom-dir' }),
		).toEqual({ pagefindDir: 'custom-dir' });
	});

	it('derives a nested subdirectory when outputPath is nested inside outDir', () => {
		expect(
			resolvePagefindDir('/tmp/out', { outputPath: '/tmp/out/a/b' }),
		).toEqual({ pagefindDir: 'a/b' });
	});

	it('falls back to "pagefind" and warns when outputPath escapes outDir', () => {
		const result = resolvePagefindDir('/tmp/out', {
			outputPath: '/somewhere/else',
		});
		expect(result.pagefindDir).toBe('pagefind');
		expect(result.warning).toMatch(/outside the build output directory/);
		expect(result.warning).toContain('/somewhere/else');
	});

	it('has no warning when outputPath resolves inside outDir', () => {
		const result = resolvePagefindDir('/tmp/out', {
			outputPath: '/tmp/out/custom-dir',
		});
		expect(result.warning).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter docusaurus-plugin-pagefind exec vitest run src/resolvePagefindDir.spec.ts`
Expected: FAIL — `Cannot find module './resolvePagefindDir'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `packages/docusaurus-plugin-pagefind/src/resolvePagefindDir.ts`:

```ts
import path from 'node:path';
import type { PluginOptions } from './options';
import { resolveOutputPath } from './runPagefind';

export interface PagefindDirResult {
	pagefindDir: string;
	warning?: string;
}

/**
 * Resolves the pagefind output directory relative to `outDir`, for exposing
 * to the client as the base of the runtime `pagefind.js` URL. Falls back to
 * the default 'pagefind' subdirectory (with a warning) when a custom
 * `outputPath` writes outside `outDir`, since no reliable browser-fetchable
 * URL can be derived in that case.
 */
export function resolvePagefindDir(
	outDir: string,
	options: PluginOptions,
): PagefindDirResult {
	const resolvedOutputPath = resolveOutputPath(outDir, options);
	const relative = path.relative(outDir, resolvedOutputPath);
	const escapesOutDir = relative.startsWith('..') || path.isAbsolute(relative);

	if (escapesOutDir) {
		return {
			pagefindDir: 'pagefind',
			warning:
				`docusaurus-plugin-pagefind: outputPath "${options.outputPath}" resolves ` +
				`outside the build output directory ("${outDir}"). Client-side search ` +
				'may not be able to locate the Pagefind index automatically at runtime; ' +
				`make sure it is served at "${outDir}/pagefind", or serve the custom ` +
				'location yourself.',
		};
	}

	return { pagefindDir: relative.split(path.sep).join('/') };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter docusaurus-plugin-pagefind exec vitest run src/resolvePagefindDir.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/docusaurus-plugin-pagefind/src/resolvePagefindDir.ts packages/docusaurus-plugin-pagefind/src/resolvePagefindDir.spec.ts
git commit -m "feat: add resolvePagefindDir for baseUrl/outputPath-aware search"
```

---

### Task 2: `PagefindClient.ts` — hidden dynamic import + baseUrl-aware URL builder

**Files:**
- Modify: `packages/docusaurus-plugin-pagefind/src/theme/SearchBar/PagefindClient.ts`
- Modify: `packages/docusaurus-plugin-pagefind/src/theme/SearchBar/PagefindClient.spec.ts`

**Interfaces:**
- Produces: `createPagefindSearch(pagefindJsUrl: string)` (signature changed — now takes the runtime URL as a required parameter instead of using a hardcoded path); `buildPagefindJsUrl(baseUrl: string, pagefindDir: string): string` (new, exported). Task 4 (`SearchBar/index.tsx`) consumes both.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `packages/docusaurus-plugin-pagefind/src/theme/SearchBar/PagefindClient.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	__resetForTest,
	buildPagefindJsUrl,
	createPagefindSearch,
} from './PagefindClient';

const PAGEFIND_JS_URL = '/docusaurus-plugin-pagefind/pagefind/pagefind.js';

const mockPagefind = {
	search: vi.fn(async (query: string) => ({
		results: query
			? [
					{
						data: async () => ({
							url: '/docs/x',
							excerpt: 'hit for ' + query,
							meta: { title: 'X' },
							sub_results: [],
						}),
					},
				]
			: [],
	})),
};

describe('createPagefindSearch', () => {
	beforeEach(() => {
		__resetForTest();
		mockPagefind.search.mockClear();
		(globalThis as any).__pagefindLoader = async () => mockPagefind;
	});

	it('accepts Algolia-shaped requests and returns Algolia-shaped responses', async () => {
		const search = createPagefindSearch(PAGEFIND_JS_URL);
		const response = await search({
			requests: [{ indexName: 'x', query: 'foo' }],
		} as any);
		expect(mockPagefind.search).toHaveBeenCalledWith('foo');
		expect(response.results[0].hits).toHaveLength(1);
		expect(response.results[0].hits[0].url).toBe('/docs/x');
		expect(response.results[0].nbHits).toBe(1);
		expect(response.results[0].page).toBe(0);
	});

	it('loads the pagefind module only once across multiple searches', async () => {
		const loader = vi.fn(async () => mockPagefind);
		(globalThis as any).__pagefindLoader = loader;
		const search = createPagefindSearch(PAGEFIND_JS_URL);
		await search({ requests: [{ indexName: 'x', query: 'a' }] } as any);
		await search({ requests: [{ indexName: 'x', query: 'b' }] } as any);
		expect(loader).toHaveBeenCalledTimes(1);
	});

	it('passes the given pagefind.js URL to the loader', async () => {
		const loader = vi.fn(async () => mockPagefind);
		(globalThis as any).__pagefindLoader = loader;
		const search = createPagefindSearch(PAGEFIND_JS_URL);
		await search({ requests: [{ indexName: 'x', query: 'a' }] } as any);
		expect(loader).toHaveBeenCalledWith(PAGEFIND_JS_URL);
	});

	it('returns empty hits when the pagefind module fails to load', async () => {
		(globalThis as any).__pagefindLoader = async () => {
			throw new Error('module not found');
		};
		const search = createPagefindSearch(PAGEFIND_JS_URL);
		const response = await search({
			requests: [{ indexName: 'x', query: 'x' }],
		} as any);
		expect(response.results[0].hits).toEqual([]);
	});
});

describe('buildPagefindJsUrl', () => {
	it('joins a root baseUrl with the default pagefind subdirectory', () => {
		expect(buildPagefindJsUrl('/', 'pagefind')).toBe('/pagefind/pagefind.js');
	});

	it('joins a non-root baseUrl with the default pagefind subdirectory', () => {
		expect(buildPagefindJsUrl('/docusaurus-plugin-pagefind/', 'pagefind')).toBe(
			'/docusaurus-plugin-pagefind/pagefind/pagefind.js',
		);
	});

	it('joins a custom pagefind subdirectory', () => {
		expect(buildPagefindJsUrl('/base/', 'custom-dir')).toBe(
			'/base/custom-dir/pagefind.js',
		);
	});

	it('collapses double slashes when pagefindDir is empty', () => {
		expect(buildPagefindJsUrl('/base/', '')).toBe('/base/pagefind.js');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter docusaurus-plugin-pagefind exec vitest run src/theme/SearchBar/PagefindClient.spec.ts`
Expected: FAIL — `createPagefindSearch` is called with an argument the current signature ignores, `buildPagefindJsUrl` is not exported (`SyntaxError`/`undefined is not a function`).

- [ ] **Step 3: Write the implementation**

Replace the full contents of `packages/docusaurus-plugin-pagefind/src/theme/SearchBar/PagefindClient.ts`:

```ts
import {
	type DocSearchHit,
	expandPagefindResult,
	type PagefindResultData,
} from './transformHits';

interface PagefindModule {
	search(
		query: string,
	): Promise<{ results: Array<{ data: () => Promise<PagefindResultData> }> }>;
}

interface AlgoliaSearchRequest {
	requests: Array<{ indexName: string; query?: string; params?: string }>;
}

interface AlgoliaSearchResponseItem {
	hits: DocSearchHit[];
	nbHits: number;
	page: number;
	nbPages: number;
	hitsPerPage: number;
	query: string;
	params: string;
	index: string;
	processingTimeMS: number;
}

interface AlgoliaSearchResponse {
	results: AlgoliaSearchResponseItem[];
}

let pagefindPromise: Promise<PagefindModule | null> | null = null;

/**
 * Hides the dynamic import inside `Function` so webpack never statically
 * analyzes or bundles it — the same technique runPagefind.ts uses for the
 * Node-side `import('pagefind')`. The specifier is a fully dynamic,
 * baseUrl-aware URL resolved only at runtime in the browser.
 */
const importPagefindModule = new Function(
	'specifier',
	'return import(specifier)',
) as (specifier: string) => Promise<PagefindModule>;

function defaultLoader(pagefindJsUrl: string): Promise<PagefindModule> {
	return importPagefindModule(pagefindJsUrl);
}

async function loadPagefind(
	pagefindJsUrl: string,
): Promise<PagefindModule | null> {
	if (pagefindPromise) return pagefindPromise;
	const loader = (globalThis as any).__pagefindLoader ?? defaultLoader;
	pagefindPromise = loader(pagefindJsUrl).catch(() => null);
	return pagefindPromise;
}

const MAX_PAGES = 8;
const MAX_HITS = 20;

function buildResponseItem(
	query: string,
	indexName: string,
	hits: DocSearchHit[] = [],
): AlgoliaSearchResponseItem {
	return {
		hits,
		nbHits: hits.length,
		page: 0,
		nbPages: hits.length > 0 ? 1 : 0,
		hitsPerPage: MAX_HITS,
		query,
		params: '',
		index: indexName,
		processingTimeMS: 0,
	};
}

/**
 * Joins a Docusaurus `baseUrl` and the resolved pagefind subdirectory into
 * the runtime URL for `pagefind.js`, collapsing any doubled slashes.
 */
export function buildPagefindJsUrl(
	baseUrl: string,
	pagefindDir: string,
): string {
	return `${baseUrl}/${pagefindDir}/pagefind.js`.replace(/\/{2,}/g, '/');
}

export function createPagefindSearch(pagefindJsUrl: string) {
	return async function search(
		req: AlgoliaSearchRequest,
	): Promise<AlgoliaSearchResponse> {
		const first = req.requests[0];
		const query = first?.query ?? '';
		const indexName = first?.indexName ?? 'pagefind';
		const pf = await loadPagefind(pagefindJsUrl);
		if (!pf || !query) {
			return { results: [buildResponseItem(query, indexName)] };
		}
		const result = await pf.search(query);
		const sliced = result.results.slice(0, MAX_PAGES);
		const data = await Promise.all(sliced.map((r) => r.data()));
		const hits = data
			.flatMap((d) => expandPagefindResult(d, query))
			.slice(0, MAX_HITS);
		return { results: [buildResponseItem(query, indexName, hits)] };
	};
}

export function __resetForTest(): void {
	pagefindPromise = null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter docusaurus-plugin-pagefind exec vitest run src/theme/SearchBar/PagefindClient.spec.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/docusaurus-plugin-pagefind/src/theme/SearchBar/PagefindClient.ts packages/docusaurus-plugin-pagefind/src/theme/SearchBar/PagefindClient.spec.ts
git commit -m "fix: load pagefind runtime via a baseUrl-aware, unbundled dynamic import"
```

---

### Task 3: `index.ts` — expose `pagefindDir` via plugin data, drop the webpack externals hack

**Files:**
- Modify: `packages/docusaurus-plugin-pagefind/src/index.ts`
- Test: `packages/docusaurus-plugin-pagefind/src/index.spec.ts` (new)

**Interfaces:**
- Consumes: `resolvePagefindDir(outDir, options): PagefindDirResult` from Task 1.
- Produces: the plugin's `contentLoaded` calls `actions.setGlobalData({ pagefindDir })`. Task 4 reads this back client-side with `usePluginData('docusaurus-plugin-pagefind')` and expects a `{ pagefindDir: string }` shape.

- [ ] **Step 1: Write the failing tests**

Create `packages/docusaurus-plugin-pagefind/src/index.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('./runPagefind', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./runPagefind')>();
	return { ...actual, runPagefind: vi.fn().mockResolvedValue(undefined) };
});

import pluginPagefind from './index';
import { runPagefind } from './runPagefind';

function createContext(outDir: string): any {
	return { outDir };
}

describe('pluginPagefind', () => {
	it('exposes the resolved pagefindDir via contentLoaded/setGlobalData', () => {
		const plugin = pluginPagefind(createContext('/tmp/out'), {});
		const setGlobalData = vi.fn();
		plugin.contentLoaded?.({
			content: undefined,
			actions: { addRoute: vi.fn(), createData: vi.fn(), setGlobalData },
		} as any);
		expect(setGlobalData).toHaveBeenCalledWith({ pagefindDir: 'pagefind' });
	});

	it('exposes a custom pagefindDir when outputPath is inside outDir', () => {
		const plugin = pluginPagefind(createContext('/tmp/out'), {
			outputPath: '/tmp/out/custom-dir',
		});
		const setGlobalData = vi.fn();
		plugin.contentLoaded?.({
			content: undefined,
			actions: { addRoute: vi.fn(), createData: vi.fn(), setGlobalData },
		} as any);
		expect(setGlobalData).toHaveBeenCalledWith({
			pagefindDir: 'custom-dir',
		});
	});

	it('warns during postBuild when outputPath escapes outDir, and still runs pagefind', async () => {
		const plugin = pluginPagefind(createContext('/tmp/out'), {
			outputPath: '/elsewhere',
		});
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await plugin.postBuild?.({ outDir: '/tmp/out' } as any);
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('outside the build output directory'),
		);
		expect(runPagefind).toHaveBeenCalledWith(
			'/tmp/out',
			expect.objectContaining({ outputPath: '/elsewhere' }),
		);
		warnSpy.mockRestore();
	});

	it('does not warn during postBuild for the default outputPath', async () => {
		const plugin = pluginPagefind(createContext('/tmp/out'), {});
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await plugin.postBuild?.({ outDir: '/tmp/out' } as any);
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it('no longer configures webpack externals for the pagefind runtime path', () => {
		const plugin = pluginPagefind(createContext('/tmp/out'), {});
		expect(plugin.configureWebpack).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter docusaurus-plugin-pagefind exec vitest run src/index.spec.ts`
Expected: FAIL — `plugin.contentLoaded` is `undefined` (not yet implemented), and `plugin.configureWebpack` is currently defined (last test fails too).

- [ ] **Step 3: Write the implementation**

Replace the full contents of `packages/docusaurus-plugin-pagefind/src/index.ts`:

```ts
import path from 'node:path';
import type { LoadContext, Plugin } from '@docusaurus/types';
import { injectIgnoreMarkers } from './injectIgnoreMarkers';
import { type PluginOptions, resolveOptions } from './options';
import { resolvePagefindDir } from './resolvePagefindDir';
import { runPagefind } from './runPagefind';

export default function pluginPagefind(
	context: LoadContext,
	options: PluginOptions = {},
): Plugin<void> {
	const mergedOptions = resolveOptions(options);
	const { pagefindDir, warning } = resolvePagefindDir(
		context.outDir,
		mergedOptions,
	);

	return {
		name: 'docusaurus-plugin-pagefind',

		getThemePath() {
			// dist/theme/ — compiled JS consumed by webpack
			return path.resolve(__dirname, './theme');
		},

		getTypeScriptThemePath() {
			// src/theme/ — TypeScript source for swizzling only, NOT processed by webpack
			return path.resolve(__dirname, '../src/theme');
		},

		contentLoaded({ actions }) {
			// Exposes the resolved pagefind subdirectory to the client, read via
			// usePluginData('docusaurus-plugin-pagefind') in SearchBar.
			actions.setGlobalData({ pagefindDir });
		},

		async postBuild({ outDir }) {
			if (warning) {
				console.warn(warning);
			}
			if (mergedOptions.excludeGlobs && mergedOptions.excludeGlobs.length > 0) {
				await injectIgnoreMarkers(outDir, mergedOptions.excludeGlobs);
			}
			await runPagefind(outDir, mergedOptions);
		},
	};
}

export type { PluginOptions } from './options';
export type { PagefindDirResult } from './resolvePagefindDir';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter docusaurus-plugin-pagefind exec vitest run src/index.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the full unit test suite**

Run: `pnpm --filter docusaurus-plugin-pagefind test`
Expected: PASS — all spec files, including Tasks 1 and 2's.

- [ ] **Step 6: Commit**

```bash
git add packages/docusaurus-plugin-pagefind/src/index.ts packages/docusaurus-plugin-pagefind/src/index.spec.ts
git commit -m "fix: expose pagefindDir via plugin data, drop webpack externals hack"
```

---

### Task 4: `SearchBar/index.tsx` — assemble the real URL client-side, drop the dead preconnect hint

**Files:**
- Modify: `packages/docusaurus-plugin-pagefind/src/theme/SearchBar/index.tsx`

**Interfaces:**
- Consumes: `createPagefindSearch(pagefindJsUrl: string)` and `buildPagefindJsUrl(baseUrl: string, pagefindDir: string): string` from `./PagefindClient` (Task 2); the client global data shape `{ pagefindDir: string }` set by Task 3's `contentLoaded`.
- No unit test in this task: this file has no existing test file (no React testing library in this package), and its component-level behavior is verified end-to-end by Task 5's Playwright test. Verify correctness here via TypeScript.

- [ ] **Step 1: Edit the imports**

In `packages/docusaurus-plugin-pagefind/src/theme/SearchBar/index.tsx`, replace:

```ts
import '@docsearch/css';
import type {
	DocSearchModalProps,
	DocSearchTransformClient,
} from '@docsearch/react';
import { DocSearchButton, useDocSearchKeyboardEvents } from '@docsearch/react';
import Head from '@docusaurus/Head';
import { useHistory } from '@docusaurus/router';
import { Icon } from '@iconify/react';
```

with:

```ts
import '@docsearch/css';
import type {
	DocSearchModalProps,
	DocSearchTransformClient,
} from '@docsearch/react';
import { DocSearchButton, useDocSearchKeyboardEvents } from '@docsearch/react';
import { useHistory } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePluginData } from '@docusaurus/useGlobalData';
import { Icon } from '@iconify/react';
```

(`Head` is dropped — its only use, the preconnect link, is removed in Step 3.)

- [ ] **Step 2: Import `buildPagefindJsUrl` and declare the local global-data type**

Replace:

```ts
import { createPagefindSearch } from './PagefindClient';
import type { DocSearchHit, HighlightSegment } from './transformHits';
import './styles.css';
```

with:

```ts
import { buildPagefindJsUrl, createPagefindSearch } from './PagefindClient';
import type { DocSearchHit, HighlightSegment } from './transformHits';
import './styles.css';

interface PagefindGlobalData {
	pagefindDir: string;
}
```

`PagefindGlobalData` is declared locally rather than imported from `../../resolvePagefindDir` — `tsconfig.theme.json` restricts `rootDir` to `src/theme`, so files under `src/theme` cannot import from outside it.

- [ ] **Step 3: Compute the runtime URL and pass it into `createPagefindSearch`**

Replace:

```ts
export default function SearchBar(): React.JSX.Element {
	const history = useHistory();
	const searchButtonRef = useRef<HTMLButtonElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [initialQuery, setInitialQuery] = useState<string | undefined>(
		undefined,
	);

	const pagefindSearch = useMemo(() => createPagefindSearch(), []);
```

with:

```ts
export default function SearchBar(): React.JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	const { pagefindDir } = usePluginData(
		'docusaurus-plugin-pagefind',
	) as PagefindGlobalData;
	const pagefindJsUrl = useMemo(
		() => buildPagefindJsUrl(siteConfig.baseUrl, pagefindDir),
		[siteConfig.baseUrl, pagefindDir],
	);

	const history = useHistory();
	const searchButtonRef = useRef<HTMLButtonElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [initialQuery, setInitialQuery] = useState<string | undefined>(
		undefined,
	);

	const pagefindSearch = useMemo(
		() => createPagefindSearch(pagefindJsUrl),
		[pagefindJsUrl],
	);
```

- [ ] **Step 4: Remove the dead preconnect hint**

Replace:

```tsx
	return (
		<>
			<Head>
				<link rel="preconnect" href="/pagefind/" />
			</Head>
			<DocSearchButton
```

with:

```tsx
	return (
		<>
			<DocSearchButton
```

- [ ] **Step 5: Typecheck the theme source**

Run: `pnpm --filter docusaurus-plugin-pagefind exec tsc -p tsconfig.theme.json --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/docusaurus-plugin-pagefind/src/theme/SearchBar/index.tsx
git commit -m "fix: build the pagefind runtime URL client-side from baseUrl + pagefindDir"
```

---

### Task 5: End-to-end regression test + changeset

**Files:**
- Modify: `package.json` (root) — add `@playwright/test` devDependency and a `test:e2e` script
- Create: `e2e/tests/search.spec.ts`
- Create: `.changeset/fix-pagefind-baseurl-search.md`

**Interfaces:**
- Consumes: the built `apps/wiki` demo site (already configured with `baseUrl: '/docusaurus-plugin-pagefind/'`), served via the existing `e2e/playwright.config.ts` (`webServer: 'pnpm --filter wiki serve'`, `baseURL: 'http://localhost:3000'`).
- This task adds no new production code — it proves Tasks 1-4 fixed the live bug, and would have caught the original regression had it existed beforehand.

- [ ] **Step 1: Add the Playwright test runner and an e2e script**

In the root `package.json`, add `@playwright/test` to `devDependencies` (same version as the existing `playwright` entry) and a script to run the e2e suite:

```json
	"scripts": {
		"build": "pnpm --filter docusaurus-plugin-pagefind build",
		"test": "pnpm --filter docusaurus-plugin-pagefind test",
		"test:e2e": "playwright test --config e2e/playwright.config.ts",
		"build:wiki": "pnpm --filter wiki build",
		"dev:wiki": "pnpm build && pnpm build:wiki && pnpm --filter wiki serve",
		"typecheck": "pnpm --filter docusaurus-plugin-pagefind exec tsc --noEmit",
		"prepare": "husky"
	},
```

```json
	"devDependencies": {
		"@biomejs/biome": "2.5.3",
		"@changesets/cli": "^2.27.0",
		"@docusaurus/tsconfig": "^3.10.0",
		"@playwright/test": "^1.61.1",
		"husky": "^9.1.7",
		"lint-staged": "^17.0.8",
		"playwright": "^1.61.1",
		"typescript": "^5.0.0"
	},
```

Run: `pnpm install`
Expected: lockfile updates, install succeeds (the Chromium browser binary is already cached locally from the existing `playwright` install at the same version, so no separate browser download should be needed — if Playwright reports a missing browser, run `pnpm exec playwright install chromium`).

- [ ] **Step 2: Write the e2e test**

Create `e2e/tests/search.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('search returns a real result for content that exists on the site', async ({
	page,
}) => {
	await page.goto('/docusaurus-plugin-pagefind/');

	await page.getByRole('button', { name: /search/i }).click();
	await page.getByPlaceholder('Search docs').fill('installation');

	const hit = page.locator('.pagefindHit').first();
	await expect(hit).toBeVisible();
	await expect(hit).toContainText(/installation/i);
});
```

- [ ] **Step 3: Build the plugin and the demo site**

Run: `pnpm build && pnpm build:wiki`
Expected: both succeed; `apps/wiki/build/pagefind/pagefind.js` exists.

- [ ] **Step 4: Run the e2e test and confirm it passes**

Run: `pnpm test:e2e`
Expected: PASS (1 test). This is the regression test: prior to Tasks 1-4, this exact test would have failed with a timeout on `expect(hit).toBeVisible()`, since the modal shows "No results" instead.

- [ ] **Step 5: Add a changeset**

Create `.changeset/fix-pagefind-baseurl-search.md`, matching this repo's existing changeset format:

```md
---
"docusaurus-plugin-pagefind": patch
---

fix search returning no results under a non-root baseUrl or custom outputPath
```

- [ ] **Step 6: Run the full plugin test suite and typecheck one more time**

Run: `pnpm test && pnpm typecheck && pnpm --filter docusaurus-plugin-pagefind exec tsc -p tsconfig.theme.json --noEmit`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml e2e/tests/search.spec.ts .changeset/fix-pagefind-baseurl-search.md
git commit -m "test: add e2e regression test for pagefind search under a non-root baseUrl"
```

---

## Post-plan verification

After Task 5, manually re-run the original repro from the design spec to confirm the fix end-to-end:

```bash
pnpm build && pnpm build:wiki
pnpm --filter wiki serve --port 3005
```

Open `http://localhost:3005/docusaurus-plugin-pagefind/`, open search, type "installation", and confirm a real result now appears (previously: "No results for installation").
