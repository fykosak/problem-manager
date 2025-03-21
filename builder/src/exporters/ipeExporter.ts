import Exporter from './exporter';

export default class IpeExporter extends Exporter {
	public async innerExport() {
		// export svg
		await this.execute('iperender', [
			'-svg',
			this.inputFile,
			this.getTargetFile('svg'),
		]);

		// export pdf
		await this.execute('iperender', [
			'-pdf',
			this.inputFile,
			this.getTargetFile('pdf'),
		]);
	}
}
