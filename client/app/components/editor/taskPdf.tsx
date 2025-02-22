import { trpc } from '~/trpc';
import { Button } from '../ui/button';
import PdfViewer from './pdfViewer';
import { forwardRef, useCallback, useState } from 'react';
import { Loader, Minus, Plus } from 'lucide-react';

import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

const TaskPdf = forwardRef((_, ref) => {
	const [isRunning, setIsRunning] = useState(false);
	const [file, setFile] = useState<string | null>(null);

	const buildPdf = useCallback(async () => {
		setIsRunning(true);
		try {
			const data = await trpc.problem.build.mutate(401);
			setFile(`data:application/pdf;base64,${data['file']}`);
		} finally {
			setIsRunning(false);
		}
	}, []);

	const [scale, setScale] = useState(0.8);
	function setCappedScale(scale: number) {
		const newScale = Math.max(Math.min(scale, 2), 0.2);
		setScale(newScale);
	}

	return (
		<div ref={ref}>
			<div className="flex flex-row align-center gap-1">
				<Button onClick={buildPdf}>
					{!isRunning ? (
						'Zkompilovat'
					) : (
						<>
							<Loader /> Kompilování
						</>
					)}
				</Button>
				<Button size="icon" onClick={() => setCappedScale(scale + 0.1)}>
					<Plus />
				</Button>
				<Button size="icon" onClick={() => setCappedScale(scale - 0.1)}>
					<Minus />
				</Button>
			</div>
			<PdfViewer file={file} scale={scale} />
		</div>
	);
});

export default TaskPdf;
