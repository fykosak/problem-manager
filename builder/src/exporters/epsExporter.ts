import Exporter from './exporter';

export default class EpsExporter extends Exporter {
	public async innerExport() {
		// export pdf
		await this.execute('epstopdf', [
			this.inputFile,
			'--outfile=' + this.getTargetFile('pdf'),
		]);

		// Inkscape crashes when exporting from eps because of the lack of X
		// server, so just export it from pdf instead.
		await this.execute('inkscape', [
			'--export-plain-svg',
			this.getTargetFile('pdf'),
			'-o',
			this.getTargetFile('svg'),
		]);
	}
}
