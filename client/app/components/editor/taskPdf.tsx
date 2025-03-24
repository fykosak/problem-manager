import {
	CircleCheckIcon,
	CircleXIcon,
	FileCode,
	Minus,
	Plus,
} from 'lucide-react';
import {
	ForwardedRef,
	KeyboardEvent,
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import { langEnum, textTypeEnum } from '@server/db/schema';

import { trpc } from '@client/trpc';

import { Button } from '../ui/button';
import { Loader } from '../ui/loader';
import { BuildLog } from './buildLog';
import PdfViewer from './pdfViewer';

const TaskPdf = forwardRef(
	(
		{
			problemId,
			textType,
			textLang,
		}: {
			problemId: number;
			textType: (typeof textTypeEnum.enumValues)[number];
			textLang: (typeof langEnum.enumValues)[number];
		},
		outerRef: ForwardedRef<HTMLDivElement>
	) => {
		const innerRef = useRef<HTMLDivElement>(null);
		useImperativeHandle(outerRef, () => innerRef.current!, []);

		const [isRunning, setIsRunning] = useState(false);
		const [file, setFile] = useState<string | null>(null);
		const [log, setLog] = useState<string>('');
		const [showLog, setShowLog] = useState(false);
		const [buildSuccessful, setBuildSuccessful] = useState<boolean | null>(
			null
		);

		const buildPdf = useCallback(async () => {
			setIsRunning(true);
			try {
				// eslint-disable-next-line
				const data = await trpc.problem.build.mutate({
					problemId: problemId,
					type: textType,
					lang: textLang,
				});
				// eslint-disable-next-line
				setFile(`data:application/pdf;base64,${data['file']}`);
				// eslint-disable-next-line
				setLog(`${data['output']}`);
				// eslint-disable-next-line
				setBuildSuccessful(data['exitCode'] === 0);
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

		function handleWheel(this: HTMLDivElement, event: WheelEvent) {
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
			if (innerRef.current) {
				innerRef.current.addEventListener('wheel', handleWheel, {
					passive: false,
				});
			}
			return () => {
				if (innerRef.current) {
					innerRef.current.removeEventListener('wheel', handleWheel);
				}
			};
		}, [pdfWidth]);

		return (
			<div
				ref={innerRef}
				className="flex flex-col h-full"
				onKeyDown={handleKeyDown}
				/* make this div selectable for it to handle key down events*/
				tabIndex={1}
			>
				<div className="flex flex-row align-center gap-1 py-2">
					{/* eslint-disable-next-line */}
					<Button variant="secondary" onClick={buildPdf}>
						{!isRunning ? (
							<>
								{buildSuccessful === true && (
									<CircleCheckIcon className="text-green-500" />
								)}
								{buildSuccessful === false && (
									<CircleXIcon className="text-red-500" />
								)}{' '}
								Zkompilovat
							</>
						) : (
							<>
								<Loader /> Kompilování
							</>
						)}
					</Button>
					<Button
						size="icon"
						variant={showLog ? 'default' : 'secondary'}
						onClick={() => setShowLog(!showLog)}
					>
						<FileCode />
					</Button>
					<Button
						size="icon"
						variant="secondary"
						onClick={() => scaleUp()}
					>
						<Plus />
					</Button>
					<Button
						size="icon"
						variant="secondary"
						onClick={() => scaleDown()}
					>
						<Minus />
					</Button>
				</div>
				{/* h-px is for the container to be able to grow the viewer, otherwise
			the viewer will be it's full height and the container will not downsize it*/}
				{showLog ? (
					<BuildLog log={log} />
				) : (
					<PdfViewer
						file={file}
						width={pdfWidth}
						className="grow h-px"
					/>
				)}
			</div>
		);
	}
);

export default TaskPdf;
