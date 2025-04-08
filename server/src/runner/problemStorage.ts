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

	/**
	 * List files, that are in the provided directory. Returns the files as
	 * basenames (file.ext without dir)
	 */
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

	/**
	 * List uploaded files as basenames
	 */
	public async getFiles() {
		return await this.getFilesFromDirectory(this.getFilesDirectory());
	}

	/**
	 * List exported files as basenames
	 */
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

	private async getExportedFileAsDataUri(filename: string) {
		const filepath = this.getPathForExportedFile(filename);
		const ext = path.parse(filename).ext;
		let buffer = 'data:image/';
		switch (ext) {
			case '.svg':
				buffer += 'svg+xml';
				break;
			case '.png':
				buffer += 'png';
				break;
			case '.jpg':
				buffer += 'jpeg';
				break;
			default:
				throw new Error('Unsupported extension');
		}

		const fileData = await fs.readFile(filepath);
		buffer += ';base64,';
		buffer += fileData.toString('base64');
		return buffer;
	}

	/**
	 * Find file in a suited format for web and return it as data URI.
	 *
	 * If the filename is provided with extension, the ext is striped
	 * and suited file format is selected.
	 *
	 * @param filename Filename with or without extension
	 */
	public async getFileForWeb(filename: string) {
		const baseFilename = path.parse(filename).name;
		const exportedFiles = new Set(await this.getExportedFiles());
		for (const ext of ['.svg', '.png', '.jpg']) {
			if (exportedFiles.has(baseFilename + ext)) {
				return await this.getExportedFileAsDataUri(baseFilename + ext);
			}
		}

		throw new ProblemStorageError('No suited file format found');
	}
}
