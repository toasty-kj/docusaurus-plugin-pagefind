import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { addIgnoreAttribute, injectIgnoreMarkers } from './injectIgnoreMarkers';

describe('addIgnoreAttribute', () => {
	it('adds data-pagefind-ignore="all" to a bare <body> tag', () => {
		expect(addIgnoreAttribute('<html><body><h1>hi</h1></body></html>')).toBe(
			'<html><body data-pagefind-ignore="all"><h1>hi</h1></body></html>',
		);
	});

	it('preserves existing body attributes', () => {
		expect(addIgnoreAttribute('<body class="x" dir="ltr">a</body>')).toBe(
			'<body class="x" dir="ltr" data-pagefind-ignore="all">a</body>',
		);
	});

	it('is idempotent when data-pagefind-ignore already exists', () => {
		const html = '<body data-pagefind-ignore="all">a</body>';
		expect(addIgnoreAttribute(html)).toBe(html);
	});

	it('returns unchanged html when there is no <body> tag', () => {
		const html = '<html><head></head></html>';
		expect(addIgnoreAttribute(html)).toBe(html);
	});

	it('handles uppercase <BODY> and preserves tag casing', () => {
		expect(addIgnoreAttribute('<BODY>a</BODY>')).toBe(
			'<BODY data-pagefind-ignore="all">a</BODY>',
		);
	});
});

describe('injectIgnoreMarkers', () => {
	it('injects attribute only into html files matching the glob', async () => {
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pagefind-test-'));
		const hiddenFile = path.join(dir, 'wiki-hidden', 'secret', 'index.html');
		const normalFile = path.join(dir, 'guide', 'index.html');
		await fs.mkdir(path.dirname(hiddenFile), { recursive: true });
		await fs.mkdir(path.dirname(normalFile), { recursive: true });
		await fs.writeFile(hiddenFile, '<html><body>secret</body></html>');
		await fs.writeFile(normalFile, '<html><body>guide</body></html>');

		try {
			const count = await injectIgnoreMarkers(dir, ['**/wiki-hidden/**']);
			expect(count).toBe(1);
			expect(await fs.readFile(hiddenFile, 'utf8')).toContain(
				'data-pagefind-ignore="all"',
			);
			expect(await fs.readFile(normalFile, 'utf8')).not.toContain(
				'data-pagefind-ignore',
			);
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	it('returns 0 and does nothing when globs is empty', async () => {
		expect(await injectIgnoreMarkers('/nonexistent', [])).toBe(0);
	});
});
