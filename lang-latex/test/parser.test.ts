import { fileTests } from '@lezer/generator/dist/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { describe, test } from 'vitest';

import { latexLanguage } from '../dist/index.js';

const caseDir = path.dirname(fileURLToPath(import.meta.url));

for (const file of fs.readdirSync(caseDir)) {
	if (!/\.txt$/.test(file)) continue;

	const name = /^[^.]*/.exec(file);
	if (!name) {
		throw new Error('Could not get test name from ' + file);
	}
	describe(name[0], () => {
		// eslint-disable-next-line
		for (const { name, run } of fileTests(
			fs.readFileSync(path.join(caseDir, file), 'utf8'),
			file
		))
			test(name, () => run(latexLanguage.parser));
	});
}
