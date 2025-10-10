import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { ExporterError } from './errors/exporterError';

export default abstract class Exporter {
	protected readonly inputFile: string;
	protected readonly targetDirectory: string;

	constructor(inputFile: string, targetDirectory: string) {
		this.inputFile = inputFile;
		this.targetDirectory = targetDirectory;
	}

	/**
	 * Ensure directory exists (create directory if it's missing)
	 */
	protected async ensureDirectory(path: string) {
		try {
			await fs.mkdir(path, { recursive: true });
		} catch (error) {
			if (
				error instanceof Error &&
				'code' in error &&
				error.code === 'EEXIST'
			) {
				return;
			}
			throw error;
		}
	}

	protected getTmpDirectory() {
		const hash = crypto.createHash('sha1');
		hash.update(this.targetDirectory);
		return path.join('/tmp/' + hash.digest('hex'));
	}

	/**
	 * Get full path of the exported file with the given extension
	 */
	protected getTargetFile(extension: string) {
		const filename = path.parse(this.inputFile).name;
		return path.join(this.targetDirectory, filename + '.' + extension);
	}

	/**
	 * Create symlink to the original file (with the same filename) inside the target directory
	 */
	protected async createSymlink() {
		let extension = path.extname(this.inputFile);
		if (extension.startsWith('.')) {
			extension = extension.slice(1);
		}
		const targetFile = this.getTargetFile(extension);
		try {
			await fs.symlink(
				path.relative(path.dirname(targetFile), this.inputFile),
				targetFile
			);
		} catch (error) {
			if (
				error instanceof Error &&
				'code' in error &&
				error.code === 'EEXIST'
			) {
				// symlink already exists, skip
				return;
			}
			throw error;
		}
	}

	/**
	 * Execute bash command with arguments.
	 * Wrapper around node:child_process.spawn to make in it a promise.
	 */
	protected execute(
		command: string,
		args: string[] = [],
		cwd: string | undefined = undefined,
		env: Record<string, string> = {}
	) {
		console.log(args);
		return new Promise((resolve, reject) => {
			const commandProcess = spawn(command, args, {
				cwd: cwd,
				env: {
					...process.env,
					...env,
				},
			});
			commandProcess.on('exit', (code) => {
				console.log(commandProcess.stderr.setEncoding('utf-8').read());
				console.log('exit code: ' + code);
				if (code && code > 0) {
					reject(
						new ExporterError(
							'command execution return with non-zero code'
						)
					);
					return;
				}
				resolve(code);
			});
			commandProcess.on('error', (error) => {
				reject(new ExporterError(error.message));
			});
		});
	}

	abstract innerExport(): Promise<void>;

	public async export() {
		await this.ensureDirectory(this.targetDirectory);
		await this.innerExport();
	}
}
