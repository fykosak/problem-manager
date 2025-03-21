import Exporter from './exporter';

export default class ImageExporter extends Exporter {
	public async innerExport() {
		await this.createSymlink();
	}
}
