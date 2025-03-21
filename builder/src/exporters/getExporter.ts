import path from 'node:path';

import type Exporter from './exporter';
import { ExporterError } from './exporter';
import SvgExporter from './svgExporter';

export default function getExporter(
	inputFile: string,
	targetDirectory: string
): Exporter {
	const extension = path.extname(inputFile);
	switch (extension) {
		case '.svg':
			return new SvgExporter(inputFile, targetDirectory);
	}

	throw new ExporterError('No exporter for this filetype');
}
