export class ExporterError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ExporterError';
	}
}
