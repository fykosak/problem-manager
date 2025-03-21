import fs from 'node:fs/promises';
import path from 'node:path';

export class ProblemStorageError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConfigError';
	}
}

async function checkAccessToFile(path: string) {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
}

export class ProblemStorage {
	problemId: number;

	constructor(problemId: number) {
		this.problemId = problemId;
	}

	getStoragePath() {
		return path.join('/data', this.problemId.toString()); // TODO to config
	}

	getFilesPath() {
		return path.join(this.getStoragePath(), 'files');
	}

	getExportedFilesPath() {
		return path.join(this.getStoragePath(), 'files-exported');
	}

	getPathForFile(filename: string) {
		return path.join(this.getFilesPath(), filename);
	}

	async getFiles() {
		const files = await fs.readdir(this.getFilesPath(), {
			withFileTypes: true,
		});
		return files
			.filter((file) => !file.isDirectory())
			.map((file) => file.name);
	}

	async deleteFile(filename: string) {
		const targetDirectory = path.join(
			this.getStoragePath(),
			'files-deleted'
		);
		try {
			await fs.access(targetDirectory);
		} catch {
			await fs.mkdir(targetDirectory, { recursive: true });
		}

		// move file to deleted directory instead of actually deleting it
		const newPath = path.join(targetDirectory, filename);
		await fs.rename(this.getPathForFile(filename), newPath);
	}

	async renameFile(oldName: string, newName: string) {
		const newPath = this.getPathForFile(newName);
		if (await checkAccessToFile(newPath)) {
			throw new ProblemStorageError(
				`File with name ${newName} already exists`
			);
		}
		await fs.rename(this.getPathForFile(oldName), newPath);
	}
}
