import path from 'node:path';

import EpsExporter from './epsExporter';
import { NoExporterError } from './errors/noExporterError';
import type Exporter from './exporter';
import ImageExporter from './imageExporter';
import IpeExporter from './ipeExporter';
import MetapostExporter from './metapostExporter';
import PdfExporter from './pdfExporter';
import PltExporter from './pltExporter';
import SvgExporter from './svgExporter';

export default function getExporter(
	inputFile: string,
	targetDirectory: string
): Exporter {
	const extension = path.extname(inputFile);
	switch (extension) {
		case '.ipe':
			return new IpeExporter(inputFile, targetDirectory);
		case '.svg':
			return new SvgExporter(inputFile, targetDirectory);
		case '.eps':
			return new EpsExporter(inputFile, targetDirectory);
		case '.pdf':
			return new PdfExporter(inputFile, targetDirectory);
		case '.mp':
			return new MetapostExporter(inputFile, targetDirectory);
		case '.plt':
			return new PltExporter(inputFile, targetDirectory);
		case '.png':
		case '.jpg':
		case '.jpeg':
			return new ImageExporter(inputFile, targetDirectory);
	}

	throw new NoExporterError('No exporter for this filetype');
}
