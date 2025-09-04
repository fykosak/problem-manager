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

		// copy .dat files
		const inputFileDirectory = path.dirname(this.inputFile);
		const files = await fs.readdir(inputFileDirectory);
		for (const file of files) {
			if (!file.endsWith('.dat')) {
				continue;
			}
			const filename = path.parse(file).base;
			await fs.copyFile(
				path.join(inputFileDirectory, filename),
				path.join(tmpDirectory, filename)
			);
		}

		await this.execute(
			'gnuplot',
			[
				'-e',
				`set format '$"%g"$';` +
					'set terminal epslatex color size 12.7cm,7.7cm;' +
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

		// generate PDF
		await this.execute(
			'pdflatex',
			[
				'-jobname',
				parsedFileName.name,
				'-interaction',
				'nonstopmode',
				'-halt-on-error',
				'-file-line-error',
				'\\documentclass{standalone}' +
					'\\usepackage{graphicx}' +
					'\\usepackage{xcolor}' +
					'\\usepackage{fkssugar}' +
					'\\begin{document}' +
					`\\input{${parsedFileName.name}.tex}` +
					'\\end{document}',
			],
			tmpDirectory
		);

		// export svg
		await this.execute('inkscape', [
			'--export-plain-svg',
			'--pdf-poppler',
			path.join(tmpDirectory, parsedFileName.name + '.pdf'),
			'-o',
			this.getTargetFile('svg'),
		]);
	}
}
