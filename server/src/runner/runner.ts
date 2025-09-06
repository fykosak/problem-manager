import { and, eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';

import config from '@server/config/config';

import { db } from '../db';
import { langEnum, textTable, textTypeEnum } from '../db/schema';
import { StorageProvider } from '../sockets/storageProvider';
import { ProblemStorage } from './problemStorage';

const storage = new StorageProvider();

export class Runner {
	private readonly storage: ProblemStorage;
	private readonly problemId: number;

	constructor(problemId: number) {
		this.problemId = problemId;
		this.storage = new ProblemStorage(problemId);
	}

	private getRunner() {
		return config.builderUrl;
	}

	public getPdfContents(
		textType: (typeof textTypeEnum.enumValues)[number],
		textLang: (typeof langEnum.enumValues)[number]
	): string {
		const absolutePath = path.join(
			'/data',
			this.problemId.toString(),
			'build',
			`input.${textType}.${textLang}.pdf`
		); // TODO to config
		return fs.readFileSync(absolutePath, { encoding: 'base64' });
	}

	public async run(
		textType: (typeof textTypeEnum.enumValues)[number],
		textLang: (typeof langEnum.enumValues)[number]
	) {
		const directoryName = this.problemId.toString();
		const absolutePath = this.storage.getStorageDirectory();

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
				eq(textTable.problemId, this.problemId),
				eq(textTable.type, textType),
				eq(textTable.lang, textLang)
			),
		});

		if (!text) {
			return null;
		}

		const persistedYdoc = await storage.getYDoc(text.textId);
		fs.writeFileSync(
			path.join(absolutePath, `${textType}.${textLang}.tex`),
			persistedYdoc.getText().toJSON()
		);

		// main file contests
		const mainFileContents =
			'\\def\\UseOption{print}' +
			'\\documentclass[czech]{fksempty}\n' +
			'\\usepackage[utf8]{inputenc}\n' +
			'\\makeatletter\\@myinputpath{{files-exported/}}\\makeatother\n' +
			'\\begin{document}\n' +
			`\\input{${textType}.${textLang}}\n` +
			'\\end{document}';
		fs.writeFileSync(
			path.join(absolutePath, `input.${textType}.${textLang}.tex`),
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
				file: `input.${textType}.${textLang}.tex`,
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

	public async exportFile(inputFile: string) {
		const response = await fetch(this.getRunner() + '/export', {
			headers: {
				'Content-Type': 'application/json',
			},
			method: 'POST',
			body: JSON.stringify({
				filepath: inputFile,
				targetDirectory: this.storage.getExportedFilesDirectory(),
			}),
		});
		if (!response.ok) {
			const jsonResponse = (await response.json()) as { message: string };
			throw new Error(jsonResponse.message);
		}
	}
}
