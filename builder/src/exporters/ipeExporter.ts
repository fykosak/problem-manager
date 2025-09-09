import Exporter from './exporter';

export default class IpeExporter extends Exporter {
	public async innerExport() {
		// create tmp directory
		const tmpDirectory = this.getTmpDirectory();
		await this.ensureDirectory(tmpDirectory);

		// export svg
		await this.execute(
			'iperender',
			['-svg', this.inputFile, this.getTargetFile('svg')],
			tmpDirectory,
			{
				IPELATEXDIR: tmpDirectory,
			}
		);

		// export pdf
		await this.execute(
			'iperender',
			['-pdf', this.inputFile, this.getTargetFile('pdf')],
			tmpDirectory,
			{
				IPELATEXDIR: tmpDirectory,
			}
		);
	}
}
