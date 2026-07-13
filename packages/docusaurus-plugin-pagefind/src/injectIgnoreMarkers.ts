import { promises as fs } from 'node:fs';
import fg from 'fast-glob';

const IGNORE_ATTRIBUTE = 'data-pagefind-ignore="all"';

export function addIgnoreAttribute(html: string): string {
	const bodyTagPattern = /<(body)\b([^>]*)>/i;
	const match = bodyTagPattern.exec(html);
	if (!match) {
		return html;
	}
	const [fullTag, tagName, attrs] = match;
	if (/\bdata-pagefind-ignore\b/i.test(attrs)) {
		return html;
	}
	const newTag = `<${tagName}${attrs} ${IGNORE_ATTRIBUTE}>`;
	return (
		html.slice(0, match.index) +
		newTag +
		html.slice(match.index + fullTag.length)
	);
}

export async function injectIgnoreMarkers(
	siteDir: string,
	globs: string[],
): Promise<number> {
	if (globs.length === 0) {
		return 0;
	}
	const files = await fg(globs, {
		cwd: siteDir,
		absolute: true,
		onlyFiles: true,
	});
	let modified = 0;
	for (const file of files) {
		if (!file.endsWith('.html')) {
			continue;
		}
		const original = await fs.readFile(file, 'utf8');
		const updated = addIgnoreAttribute(original);
		if (updated !== original) {
			await fs.writeFile(file, updated, 'utf8');
			modified += 1;
		}
	}
	return modified;
}
