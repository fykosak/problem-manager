import Exporter from './exporter';

export default class PdfExporter extends Exporter {
	public async innerExport() {
		// export svg
		await this.execute('inkscape', [
			'--export-plain-svg',
			this.inputFile,
			'-o',
			this.getTargetFile('svg'),
		]);

		await this.createSymlink();
	}
}
