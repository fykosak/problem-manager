import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Outline, Page, pdfjs } from 'react-pdf';

import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url
).toString();

export default function PdfViewer({
	file,
	scale,
}: {
	file: string | null;
	scale: number;
}) {
	const [numPages, setNumPages] = useState<number | null>(null);
	const [containerWidth, setContainerWidth] = useState(400);
	const pdfSize = containerWidth * scale;

	const container = useRef(null);

	useEffect(() => {
		const ro = new ResizeObserver((entries) => {
			for (let entry of entries) {
				setContainerWidth(entry.contentRect.width);
			}
		});

		ro.observe(container.current);
	});

	function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
		setNumPages(numPages);
	}

	return (
		<div
			className="bg-gray-500 h-[800px] relative overflow-auto flex flex-col"
			ref={container}
		>
			<Document
				file={file}
				onLoadError={console.error}
				onLoadSuccess={onDocumentLoadSuccess}
			>
				{
					//<Outline />
				}
				<div className="m-auto" style={{ width: `${pdfSize + 10}px` }}>
					{Array.from(new Array(numPages), (el, index) => (
						<Page
							pageNumber={index + 1}
							key={'page_' + index}
							width={pdfSize}
							className="mt-5 mx-[5px]"
						/>
					))}
				</div>
			</Document>
		</div>
	);
}
