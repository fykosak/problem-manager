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

	getStorageDirectory() {
		return path.join('/data', this.problemId.toString()); // TODO to config
	}

	getFilesDirectory() {
		return path.join(this.getStorageDirectory(), 'files');
	}

	getExportedFilesDirectory() {
		return path.join(this.getStorageDirectory(), 'files-exported');
	}

	getPathForFile(filename: string) {
		return path.join(this.getFilesDirectory(), filename);
	}

	getPathForExportedFile(filename: string) {
		return path.join(this.getExportedFilesDirectory(), filename);
	}

	private async getFilesFromDirectory(directory: string) {
		try {
			const files = await fs.readdir(directory, {
				withFileTypes: true,
			});
			return files
				.filter((file) => !file.isDirectory())
				.map((file) => file.name);
		} catch (error) {
			if (
				error instanceof Error &&
				'code' in error &&
				error.code === 'ENOENT'
			) {
				return [];
			} else {
				throw error;
			}
		}
	}

	public async getFiles() {
		return await this.getFilesFromDirectory(this.getFilesDirectory());
	}

	public async getExportedFiles() {
		return await this.getFilesFromDirectory(
			this.getExportedFilesDirectory()
		);
	}

	/**
	 * Check that filename is unique among existing source files
	 */
	async checkFileUnique(filename: string) {
		const basename = path.parse(filename).name;

		const existingFilenames = await this.getFiles();
		for (const existingFilename of existingFilenames) {
			if (basename === path.parse(existingFilename).name) {
				throw new ProblemStorageError(
					`File ${basename} already exists`
				);
			}
		}
	}

	/**
	 * @param data File data encoded in `base64`
	 */
	async saveFile(filename: string, data: string) {
		// Check if file is unique only if the exact same file does not already
		// exist, because than we are overring the original file and want to
		// proceed.
		if (!(await checkAccessToFile(this.getPathForFile(filename)))) {
			await this.checkFileUnique(filename);
		}
		const filepath = this.getPathForFile(filename);
		try {
			await fs.access(this.getFilesDirectory());
		} catch {
			await fs.mkdir(this.getFilesDirectory(), { recursive: true });
		}
		await fs.writeFile(filepath, data, 'base64');
	}

	async deleteFile(filename: string) {
		const targetDirectory = path.join(
			this.getStorageDirectory(),
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

		// delete exported files
		const exportedFiles = await this.getExportedFiles();
		for (const exportedFile of exportedFiles) {
			if (path.parse(exportedFile).name === path.parse(filename).name) {
				await fs.unlink(this.getPathForExportedFile(exportedFile));
			}
		}
	}

	async renameFile(oldName: string, newName: string) {
		if (path.parse(oldName).ext !== path.parse(newName).ext) {
			throw new ProblemStorageError(`Cannot change file extension`);
		}
		await this.checkFileUnique(newName);

		const newPath = this.getPathForFile(newName);
		if (await checkAccessToFile(newPath)) {
			throw new ProblemStorageError(
				`File with name ${newName} already exists`
			);
		}

		await fs.rename(this.getPathForFile(oldName), newPath);

		// rename exported files
		const exportedFiles = await this.getExportedFiles();
		for (const exportedFile of exportedFiles) {
			if (path.parse(exportedFile).name !== path.parse(oldName).name) {
				continue;
			}

			console.log(exportedFile);
			if (
				(
					await fs.lstat(this.getPathForExportedFile(exportedFile))
				).isSymbolicLink()
			) {
				console.log(exportedFile + ' is a symbolic link');
				console.log(
					'unlink ' + this.getPathForExportedFile(exportedFile)
				);
				await fs.unlink(this.getPathForExportedFile(exportedFile));
				await fs.symlink(
					path.relative(this.getExportedFilesDirectory(), newPath),
					this.getPathForExportedFile(newName)
				);
			} else {
				await fs.rename(
					this.getPathForExportedFile(exportedFile),
					this.getPathForExportedFile(
						path.parse(newName).name + path.parse(exportedFile).ext
					)
				);
			}
		}
	}
}
