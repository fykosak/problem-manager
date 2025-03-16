import { and, eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';

import { db } from '../db';
import { textTable } from '../db/schema';
import { StorageProvider } from '../sockets/storageProvider';

const storage = new StorageProvider();

export class Runner {
	private getRunner() {
		return 'http://builder:8080';
	}

	public getPdfContests(problemId: number): string {
		const absolutePath = path.join(
			'/data',
			problemId.toString(),
			'build',
			'problem.cs.pdf'
		); // TODO to config
		return fs.readFileSync(absolutePath, { encoding: 'base64' });
	}

	public async run(problemId: number) {
		const directoryName = problemId.toString();
		const absolutePath = '/data/' + directoryName; // TODO to config

		// check folder exists
		if (!fs.existsSync(absolutePath)) {
			fs.mkdir(absolutePath, { recursive: true }, (err) => {
				if (err) {
					console.error(err);
				}
			});
		}

		// create needed files
		// export task
		const text = await db.query.textTable.findFirst({
			where: and(
				eq(textTable.problemId, problemId),
				eq(textTable.type, 'task'),
				eq(textTable.lang, 'cs')
			),
		});

		if (!text) {
			return null;
		}

		const persistedYdoc = await storage.getYDoc(text.textId);
		fs.writeFileSync(
			path.join(absolutePath, 'task.cs.tex'),
			persistedYdoc.getText().toJSON()
		);

		// main file contests
		const mainFileContents =
			'\\documentclass[czech]{fksempty}\n' +
			'\\usepackage[utf8]{inputenc}\n' +
			'\\begin{document}\n' +
			'\\input{task.cs}\n' +
			'\\end{document}';
		fs.writeFileSync(
			path.join(absolutePath, 'problem.cs.tex'),
			mainFileContents
		);

		// run build on external builder
		const request = new Request(this.getRunner() + '/build', {
			headers: {
				'Content-Type': 'application/json',
			},
			method: 'POST',
			body: JSON.stringify({
				type: 'tex',
				path: directoryName,
				file: 'problem.cs.tex',
			}),
		});

		try {
			const response = await fetch(request);
			return await response.json(); // eslint-disable-line
		} catch (error) {
			console.error(error);
			return {
				error: String(error),
			};
		}
	}
}
