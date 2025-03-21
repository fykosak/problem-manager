import { spawn } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';

export class TaskBuilder {
	private readonly dirPath: string;

	constructor(dirPath: string) {
		this.dirPath = dirPath;
	}

	private getDirectoryPath() {
		return path.join('/data', this.dirPath);
	}

	private prepare() {
		console.log('create dir');
		fs.mkdirSync(path.join(this.getDirectoryPath(), 'build'), {
			recursive: true,
		});
	}

	private getBuildProcess(file: string) {
		return new Promise((resolveDone, resolveError) => {
			const process = spawn(
				'xelatex',
				[
					'-output-directory',
					'build',
					'-interaction',
					'nonstopmode',
					'-halt-on-error',
					'-file-line-error',
					file,
				],
				{
					cwd: this.getDirectoryPath(),
				}
			);

			process.on('exit', (statusCode: number) => {
				resolveDone({
					output: process.stdout.setEncoding('utf8').read() as
						| string
						| null,
					error: process.stderr.setEncoding('utf8').read() as
						| string
						| null,
					exitCode: statusCode,
				});
			});

			process.on('error', (error: Error) => {
				resolveError(error);
			});
		});
	}

	public async build(file: string) {
		try {
			this.prepare();
			const run = this.getBuildProcess(file);
			return await run;
		} catch (error) {
			console.error(error);
			return {
				error: String(error),
			};
		}
	}
}
