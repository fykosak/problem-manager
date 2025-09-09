import { ExporterError } from './exporterError';

export class NoExporterError extends ExporterError {
	constructor(message: string) {
		super(message);
		this.name = 'NoExporterError';
	}
}
