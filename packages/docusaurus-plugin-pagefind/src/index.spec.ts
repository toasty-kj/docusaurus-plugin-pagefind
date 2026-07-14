import { describe, expect, it, vi } from 'vitest';

vi.mock('./runPagefind', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./runPagefind')>();
	return { ...actual, runPagefind: vi.fn().mockResolvedValue(undefined) };
});

import pluginPagefind from './index';
import { runPagefind } from './runPagefind';

function createContext(outDir: string, baseUrl: string): any {
	return { outDir, siteConfig: { baseUrl } };
}

/**
 * Invokes the plugin's externals matcher function directly with a given
 * import request, returning whatever it passed to its callback. The
 * matcher in index.ts calls its callback synchronously, so no Promise
 * wrapping is needed.
 */
function matchExternal(
	plugin: ReturnType<typeof pluginPagefind>,
	request: string,
): string | undefined {
	const config = plugin.configureWebpack?.(
		undefined as any,
		false,
		undefined as any,
		undefined as any,
	);
	const matcher = (config as any).externals[0];
	let captured: string | undefined;
	matcher({ request }, (_err: unknown, result?: string) => {
		captured = result;
	});
	return captured;
}

describe('pluginPagefind', () => {
	it('substitutes the pagefind.js URL for a root baseUrl unchanged from today', () => {
		const plugin = pluginPagefind(createContext('/tmp/out', '/'), {});
		expect(matchExternal(plugin, '/pagefind/pagefind.js')).toBe(
			'promise import("/pagefind/pagefind.js")',
		);
	});

	it('substitutes a baseUrl-prefixed pagefind.js URL for a non-root baseUrl', () => {
		const plugin = pluginPagefind(
			createContext('/tmp/out', '/docusaurus-plugin-pagefind/'),
			{},
		);
		expect(matchExternal(plugin, '/pagefind/pagefind.js')).toBe(
			'promise import("/docusaurus-plugin-pagefind/pagefind/pagefind.js")',
		);
	});

	it('leaves unrelated requests alone (no callback substitution)', () => {
		const plugin = pluginPagefind(createContext('/tmp/out', '/'), {});
		expect(matchExternal(plugin, 'react')).toBeUndefined();
	});

	it('warns during postBuild when outputPath escapes outDir, and still runs pagefind', async () => {
		const plugin = pluginPagefind(createContext('/tmp/out', '/'), {
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
		const plugin = pluginPagefind(createContext('/tmp/out', '/'), {});
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await plugin.postBuild?.({ outDir: '/tmp/out' } as any);
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});
