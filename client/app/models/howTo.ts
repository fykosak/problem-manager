import fs from 'fs/promises';
import path from 'node:path';

/**
 * Gets a list of available docs.
 * Must be used in a server loader.
 */
export async function getAvailableDocs() {
	const files = import.meta.glob('../../docs/*.md');
	const links = [];

	for (const file in files) {
		const filename = file.split('/').pop();
		if (!filename) {
			continue;
		}
		let fileTitle = filename;

		// set first found markdown title as page title if possible
		const content = await getDocContent(filename.replace('.md', ''));
		const titleMatch = content.match(/^#+ (.*)$/m);
		if (titleMatch && titleMatch.length >= 2) {
			fileTitle = titleMatch[1]; // get first group match
		}

		links.push({
			filename: filename,
			title: fileTitle,
		});
	}

	return links;
}

/**
 * Gets the content of a markdown doc
 * Must be used in a server loader.
 *
 * @param filename filename without the extension
 */
export async function getDocContent(filename: string) {
	const filepath = path.join('./docs/', filename + '.md');
	return await fs.readFile(filepath, { encoding: 'utf8' });
}
