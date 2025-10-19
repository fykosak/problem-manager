import fs from 'node:fs/promises';
import path from 'node:path';

import Exporter from './exporter';

export default class MetapostExporter extends Exporter {
	public async innerExport() {
		// create tmp directory
		const tmpDirectory = this.getTmpDirectory();
		await this.ensureDirectory(tmpDirectory);

		// copy mp source to the directory
		const parsedFileName = path.parse(this.inputFile);
		const tmpInputFile = path.join(tmpDirectory, parsedFileName.base);
		await fs.copyFile(this.inputFile, tmpInputFile);

		// run metapost
		await this.execute(
			'mpost',
			[
				'-interaction=nonstopmode',
				'-jobname=' + parsedFileName.name,
				'-s',
				'outputtemplate="%j.%o"',
				'-s',
				'outputformat="svg"',
				tmpInputFile,
			],
			tmpDirectory
		);

		// copy exported file back
		await fs.copyFile(
			path.join(tmpDirectory, parsedFileName.name + '.svg'),
			this.getTargetFile('svg')
		);

		// export pdf
		await this.execute('inkscape', [
			this.getTargetFile('svg'),
			'-o',
			this.getTargetFile('pdf'),
		]);
	}
}
