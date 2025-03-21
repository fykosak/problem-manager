import Exporter from './exporter';

export default class SvgExporter extends Exporter {
	public async innerExport() {
		// export pdf
		await this.execute('inkscape', [
			this.inputFile,
			'-o',
			this.getTargetFile('pdf'),
		]);

		// link svg
		await this.createSymlink();
	}
}
