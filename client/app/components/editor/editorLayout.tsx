import { useEffect, useRef, useState } from 'react';

import Editor from '@client/components/editor/editor';
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
import { type trpcOutputTypes } from '@client/trpc';

import { TextTypeSelector } from './textTypeSelector';

const MOBILE_WIDTH_THRESHOLD = 768;

export function EditorLayout({
	problemId,
	textData,
}: {
	problemId: number;
	textData: {
		textsById: Map<number, trpcOutputTypes['problem']['texts'][0]>;
		textsByType: Map<string, trpcOutputTypes['problem']['texts']>;
	};
}) {
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

	//const editorComponentRef = useRef<HTMLDivElement>(null);
	const pdfComponentRef = useRef<HTMLDivElement>(null);
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const pdfContainerRef = useRef<HTMLDivElement>(null);

	const taskEditorRefs = useRef(new Map<number, HTMLDivElement>());

	const [selectedEditorTextId, setSelectedEditorTextId] = useState<number>();
	const [, setSelectedPdfTextId] = useState<number>(); // TODO use in pdf

	useEffect(() => {
		if (!componentLoaded) {
			//component not loaded, skipping append
			return;
		}

		function appendChildRef(
			container: Element | null,
			child: Element | null
		) {
			if (!container || !child) {
				return;
			}

			container.replaceChildren(child);
		}

		if (!isMobile) {
			// mount both
			appendChildRef(
				editorContainerRef.current,
				selectedEditorTextId
					? (taskEditorRefs.current.get(selectedEditorTextId) ?? null)
					: null
			);
			appendChildRef(pdfContainerRef.current, pdfComponentRef.current);
		} else {
			if (activeTab === 'editor') {
				appendChildRef(
					editorContainerRef.current,
					taskEditorRefs.current.values().next().value ?? null
				);
			} else {
				appendChildRef(
					pdfContainerRef.current,
					pdfComponentRef.current
				);
			}
		}
	}, [activeTab, isMobile, componentLoaded, selectedEditorTextId]);

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
						<TextTypeSelector
							textsByType={textData.textsByType}
							setSelectedTextId={setSelectedEditorTextId}
						/>
						<div ref={editorContainerRef} className="h-full" />
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel>
						<TextTypeSelector
							textsByType={textData.textsByType}
							setSelectedTextId={setSelectedPdfTextId}
						/>
						<div ref={pdfContainerRef} className="h-full" />
					</ResizablePanel>
				</ResizablePanelGroup>
			)}

			<div style={{ display: 'none' }}>
				{Array.from(textData.textsById.values()).map((text) => (
					<Editor
						textId={text.textId}
						key={text.textId}
						ref={(node) => {
							const refMap = taskEditorRefs.current;
							if (node) {
								refMap.set(text.textId, node);
							} else {
								refMap.delete(text.textId);
							}
						}}
					/>
				))}
				{<TaskPdf problemId={problemId} ref={pdfComponentRef} />}
			</div>
		</>
	);
}
