import { useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import { cn } from '@client/lib/utils';

import { Loader } from '../ui/loader';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url
).toString();

function PdfViewerMessage({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col justify-center items-center text-muted-foreground m-2">
			{children}
		</div>
	);
}

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
				'bg-muted relative overflow-auto flex flex-col',
				className
			)}
			ref={container}
		>
			<Document
				file={file}
				noData={
					<PdfViewerMessage>Nenačten žádný dokument</PdfViewerMessage>
				}
				error={
					<PdfViewerMessage>
						Chyba při načítání dokumentu
					</PdfViewerMessage>
				}
				loading={
					<PdfViewerMessage>
						<span className="inline-flex gap-1">
							<Loader />
							Načítání dokumentu
						</span>
					</PdfViewerMessage>
				}
				onLoadError={console.error}
				onLoadSuccess={onDocumentLoadSuccess}
				externalLinkTarget="_blank"
			>
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
