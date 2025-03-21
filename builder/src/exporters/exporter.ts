import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

export class ExporterError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ExporterError';
	}
}

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
		const targetFile = this.getTargetFile(path.extname(this.inputFile));
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
	protected execute(command: string, args: string[] = []) {
		return new Promise((resolve, reject) => {
			const process = spawn(command, args);
			process.on('exit', (code) => {
				resolve(code);
			});
			process.on('error', (error) => {
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
