import { fileTests } from '@lezer/generator/dist/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { describe, test } from 'vitest';

import { latexLanguage } from '../dist/index.js';

let caseDir = path.dirname(fileURLToPath(import.meta.url));

for (let file of fs.readdirSync(caseDir)) {
	if (!/\.txt$/.test(file)) continue;

	let name = /^[^\.]*/.exec(file);
	if (!name) {
		throw new Error('Could not get test name from ' + file);
	}
	describe(name[0], () => {
		for (let { name, run } of fileTests(
			fs.readFileSync(path.join(caseDir, file), 'utf8'),
			file
		))
			test(name, () => run(latexLanguage.parser));
	});
}
