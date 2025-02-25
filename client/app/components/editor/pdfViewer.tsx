import { useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { cn } from '~/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url
).toString();

export default function PdfViewer({
	file,
	width: width,
	className,
}: {
	file: string | null;
	width: number;
	className: string | undefined;
}) {
	const [numPages, setNumPages] = useState<number | null>(null);

	const container = useRef(null);

	function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
		setNumPages(numPages);
	}

	return (
		<div
			className={cn(
				'bg-gray-500 relative overflow-auto flex flex-col',
				className
			)}
			ref={container}
		>
			<Document
				file={file}
				onLoadError={console.error}
				onLoadSuccess={onDocumentLoadSuccess}
				externalLinkTarget="_blank"
			>
				{
					//<Outline />
				}
				<div className="m-auto" style={{ width: `${width + 10}px` }}>
					{Array.from(new Array(numPages), (el, index) => (
						<Page
							pageNumber={index + 1}
							key={'page_' + index}
							width={width}
							className="mt-5 mx-[5px]"
						/>
					))}
				</div>
			</Document>
		</div>
	);
}
