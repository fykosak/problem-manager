import Editor from '@client/components/editor/editor';
import { Route } from './+types/task.edit';
import { trpc } from '@client/trpc';
import TaskPdf from '@client/components/editor/taskPdf';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@client/components/ui/resizable';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@client/components/ui/tabs';
import { useEffect, useRef, useState } from 'react';

const MOBILE_WIDTH_THRESHOLD = 768;

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	return await trpc.problem.texts.query(parseInt(params.taskId));
}

export default function TaskEdit({ loaderData }: Route.ComponentProps) {
	const text = loaderData[0];

	// Check for mobile or desktop layout based on the current screen size.
	const [isMobile, setIsMobile] = useState(
		() => window.innerWidth < MOBILE_WIDTH_THRESHOLD
	);
	useEffect(() => {
		const handleResize = () =>
			setIsMobile(window.innerWidth < MOBILE_WIDTH_THRESHOLD);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Reset the active tab to the default value when changing layout.
	const [activeTab, setActiveTab] = useState('editor');
	useEffect(() => {
		setActiveTab('editor');
	}, [isMobile]);

	// This effect runs after the component is loaded. Using this, we can have a
	// value that determines if the component is loaded => if the refs are
	// loaded. This is then used in the next useEffect.
	const [componentLoaded, setComponentLoaded] = useState(false);
	useEffect(() => {
		setComponentLoaded(true);
	}, []);

	const editorComponentRef = useRef<HTMLDivElement>(null);
	const pdfComponentRef = useRef<HTMLDivElement>(null);
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const pdfContainerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!componentLoaded) {
			//component not loaded, skipping append
			return;
		}

		function appendChildRef(
			container: Element | null,
			child: Element | null
		) {
			if (container && child && container.childElementCount === 0) {
				container.appendChild(child);
			}
		}

		if (!isMobile) {
			// mount both
			appendChildRef(
				editorContainerRef.current,
				editorComponentRef.current
			);
			appendChildRef(pdfContainerRef.current, pdfComponentRef.current);
		} else {
			if (activeTab === 'editor') {
				appendChildRef(
					editorContainerRef.current,
					editorComponentRef.current
				);
			} else {
				appendChildRef(
					pdfContainerRef.current,
					pdfComponentRef.current
				);
			}
		}
	}, [activeTab, isMobile, componentLoaded]);

	return (
		<>
			{isMobile ? (
				<Tabs
					className="w-full h-full flex flex-col"
					onValueChange={setActiveTab}
					defaultValue="editor"
				>
					<TabsList className="w-full">
						<TabsTrigger className="w-1/2" value="editor">
							Editor
						</TabsTrigger>
						<TabsTrigger className="w-1/2" value="pdf">
							PDF
						</TabsTrigger>
					</TabsList>
					<TabsContent value="editor" className="grow">
						<div ref={editorContainerRef} className="h-full" />
					</TabsContent>
					<TabsContent value="pdf" className="grow">
						<div ref={pdfContainerRef} className="h-full" />
					</TabsContent>
				</Tabs>
			) : (
				<ResizablePanelGroup direction="horizontal">
					<ResizablePanel>
						<div ref={editorContainerRef} className="h-full" />
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel>
						<div ref={pdfContainerRef} className="h-full" />
					</ResizablePanel>
				</ResizablePanelGroup>
			)}

			<div style={{ display: 'none' }}>
				<Editor textId={text.textId} ref={editorComponentRef} />
				<TaskPdf problemId={text.problemId} ref={pdfComponentRef} />
			</div>
		</>
	);
}
