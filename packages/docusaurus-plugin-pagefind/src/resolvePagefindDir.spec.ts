import { describe, expect, it } from 'vitest';
import { buildPagefindJsUrl, resolvePagefindDir } from './resolvePagefindDir';

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
