import { trpc } from '~/trpc';
import { Button } from '../ui/button';
import PdfViewer from './pdfViewer';
import {
	KeyboardEvent,
	WheelEvent,
	forwardRef,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { Loader, Minus, Plus } from 'lucide-react';

import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

const TaskPdf = forwardRef(({ problemId }: { problemId: number }, ref) => {
	const [isRunning, setIsRunning] = useState(false);
	const [file, setFile] = useState<string | null>(null);

	const buildPdf = useCallback(async () => {
		setIsRunning(true);
		try {
			const data = await trpc.problem.build.mutate(problemId);
			setFile(`data:application/pdf;base64,${data['file']}`);
		} finally {
			setIsRunning(false);
		}
	}, []);

	const [pdfWidth, setPdfWidth] = useState(400);
	function setCappedScale(newWidth: number) {
		const cappedWidth = Math.max(newWidth, 100);
		setPdfWidth(cappedWidth);
	}

	const RESIZE_STEP = 100;
	function scaleUp() {
		setCappedScale(pdfWidth + RESIZE_STEP);
	}
	function scaleDown() {
		setCappedScale(pdfWidth - RESIZE_STEP);
	}

	// enable resizing with keyboard
	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.ctrlKey || event.metaKey) {
			if (event.key === '+') {
				event.preventDefault();
				scaleUp();
			}
			if (event.key === '-') {
				event.preventDefault();
				scaleDown();
			}
		}
	}

	function handleWheel(event: WheelEvent<HTMLDivElement>) {
		if (event.ctrlKey || event.metaKey) {
			event.stopPropagation();
			event.preventDefault();
			if (event.deltaY > 0) {
				scaleDown();
			} else {
				scaleUp();
			}
		}
	}

	useEffect(() => {
		ref.current.addEventListener('wheel', handleWheel, { passive: false });
		return () => ref.current.removeEventListener('wheel', handleWheel);
	}, [pdfWidth]);

	return (
		<div
			ref={ref}
			className="flex flex-col h-full"
			onKeyDown={handleKeyDown}
			/* make this div selectable for it to handle key down events*/
			tabIndex={1}
		>
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
				<Button size="icon" onClick={() => scaleUp()}>
					<Plus />
				</Button>
				<Button size="icon" onClick={() => scaleDown()}>
					<Minus />
				</Button>
			</div>
			{/* h-px is for the container to be able to grow the viewer, otherwise
			the viewer will be it's full height and the container will not downsize it*/}
			<PdfViewer file={file} width={pdfWidth} className="grow h-px" />
		</div>
	);
});

export default TaskPdf;
