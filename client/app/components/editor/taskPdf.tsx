import { trpc } from '~/trpc';
import { Button } from '../ui/button';
import PdfViewer from './pdfViewer';
import { useCallback, useState } from 'react';
import { Loader, Minus, Plus } from 'lucide-react';

export default function TaskPdf() {
	const [isRunning, setIsRunning] = useState(false);
	const [file, setFile] = useState<string | null>(null);

	const buildPdf = useCallback(async () => {
		setIsRunning(true);
		try {
			const data = await trpc.problem.build.mutate(401);
			console.log(data);
			setFile(`data:application/pdf;base64,${data['file']}`);
		} finally {
			setIsRunning(false);
		}
	}, []);

	const [scale, setScale] = useState(0.8);
	function setCappedScale(scale: number) {
		const newScale = Math.max(Math.min(scale, 3), 0.2);
		setScale(newScale);
	}

	return (
		<div>
			<Button onClick={buildPdf}>
				{!isRunning ? (
					'Zkompilovat'
				) : (
					<>
						<Loader /> Kompilování
					</>
				)}
			</Button>
			<Button onClick={() => setCappedScale(scale + 0.2)}>
				<Plus />
			</Button>
			<Button onClick={() => setCappedScale(scale - 0.2)}>
				<Minus />
			</Button>
			<PdfViewer file={file} scale={scale} />
		</div>
	);
}
