import fs from 'node:fs/promises';
import path from 'node:path';

import Exporter from './exporter';

export default class PltExporter extends Exporter {
	public async innerExport() {
		// create tmp directory
		const tmpDirectory = this.getTmpDirectory();
		await this.ensureDirectory(tmpDirectory);

		// copy plt source to the directory
		const parsedFileName = path.parse(this.inputFile);
		const tmpInputFile = path.join(tmpDirectory, parsedFileName.base);
		await fs.copyFile(this.inputFile, tmpInputFile);

		await this.execute(
			'gnuplot',
			[
				'-e',
				`set format '$"%g"$';` +
					'set terminal epslatex monochrome size 12.7cm,7.7cm;' +
					`set output '${parsedFileName.name}.tex'`,
				tmpInputFile,
			],
			tmpDirectory
		);

		await fs.copyFile(
			path.join(tmpDirectory, parsedFileName.name + '.tex'),
			this.getTargetFile('tex')
		);
		await fs.copyFile(
			path.join(tmpDirectory, parsedFileName.name + '.eps'),
			this.getTargetFile('eps')
		);
	}
}
