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

import { ElementContainer } from './elementContainer';
import { Layout, getLayoutLabel } from './layoutEnum';

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
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const pdfContainerRef = useRef<HTMLDivElement>(null);

	const containerRefs = useRef(new Map<string, HTMLDivElement>());

	const pdfComponentRef = useRef<HTMLDivElement>(null);
	const taskEditorRefs = useRef(new Map<number, HTMLDivElement>());

	const [selectedTextId, setSelectedTextId] = useState<{
		pdf: number | undefined;
		text1: number | undefined;
		text2: number | undefined;
	}>({
		pdf: undefined,
		text1: undefined,
		text2: undefined,
	});

	const [desktopLayout, setDesktopLayout] = useState<Layout>(Layout.TEXT_PDF);

	useEffect(() => {
		if (!componentLoaded) {
			//component not loaded, skipping append
			return;
		}

		function appendChildRef(
			container: Element | null | undefined,
			child: Element | null | undefined
		) {
			if (!container || !child) {
				return;
			}

			container.replaceChildren(child);
		}

		function getEditorRef(textId: number | undefined) {
			if (!textId) {
				return undefined;
			}
			return taskEditorRefs.current.get(textId);
		}

		// mobile layout
		if (isMobile) {
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

		// desktop layout

		if (desktopLayout === Layout.TEXT_PDF) {
			appendChildRef(
				containerRefs.current.get('text1'),
				getEditorRef(selectedTextId.text1)
			);
			appendChildRef(
				containerRefs.current.get('pdf'),
				pdfComponentRef.current
			);
		}
		if (desktopLayout === Layout.TEXT_TEXT) {
			appendChildRef(
				containerRefs.current.get('text1'),
				getEditorRef(selectedTextId.text1)
			);
			appendChildRef(
				containerRefs.current.get('text2'),
				getEditorRef(selectedTextId.text2)
			);
		}
		if (desktopLayout === Layout.TEXT_TEXT_PDF) {
			appendChildRef(
				containerRefs.current.get('text1'),
				getEditorRef(selectedTextId.text1)
			);
			appendChildRef(
				containerRefs.current.get('text2'),
				getEditorRef(selectedTextId.text2)
			);
			appendChildRef(
				containerRefs.current.get('pdf'),
				pdfComponentRef.current
			);
		}
	}, [activeTab, isMobile, componentLoaded, selectedTextId, desktopLayout]);

	function setContainerRef(container: string, node: HTMLDivElement | null) {
		const refMap = containerRefs.current;
		if (node) {
			refMap.set(container, node);
		} else {
			refMap.delete(container);
		}
	}

	function setSelectedTextIdByContainer(container: string, textId: number) {
		setSelectedTextId({ ...selectedTextId, [container]: textId });
	}

	const layoutMobile = (
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
				<div
					ref={(node) => setContainerRef('text1', node)}
					className="h-full"
				/>
			</TabsContent>
			<TabsContent value="pdf" className="grow">
				<div
					ref={(node) => setContainerRef('pdf', node)}
					className="h-full"
				/>
			</TabsContent>
		</Tabs>
	);

	const layoutTextPDF = (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel>
				<ElementContainer
					containerName="text1"
					textData={textData.textsByType}
					containerRefs={containerRefs}
					setSelectedTextId={setSelectedTextIdByContainer}
				/>
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel>
				<ElementContainer
					containerName="pdf"
					textData={textData.textsByType}
					containerRefs={containerRefs}
					setSelectedTextId={setSelectedTextIdByContainer}
				/>
			</ResizablePanel>
		</ResizablePanelGroup>
	);

	const layoutTextText = (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel>
				<ElementContainer
					containerName="text1"
					textData={textData.textsByType}
					containerRefs={containerRefs}
					setSelectedTextId={setSelectedTextIdByContainer}
				/>
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel>
				<ElementContainer
					containerName="text2"
					textData={textData.textsByType}
					containerRefs={containerRefs}
					setSelectedTextId={setSelectedTextIdByContainer}
				/>
			</ResizablePanel>
		</ResizablePanelGroup>
	);

	const layoutTextTextPDF = (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel>
				<ResizablePanelGroup direction="vertical">
					<ResizablePanel>
						<ElementContainer
							containerName="text1"
							textData={textData.textsByType}
							containerRefs={containerRefs}
							setSelectedTextId={setSelectedTextIdByContainer}
						/>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel>
						<ElementContainer
							containerName="text2"
							textData={textData.textsByType}
							containerRefs={containerRefs}
							setSelectedTextId={setSelectedTextIdByContainer}
						/>
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel>
				<ElementContainer
					containerName="pdf"
					textData={textData.textsByType}
					containerRefs={containerRefs}
					setSelectedTextId={setSelectedTextIdByContainer}
				/>
			</ResizablePanel>
		</ResizablePanelGroup>
	);

	function getLayout() {
		if (isMobile) {
			return layoutMobile;
		}

		switch (desktopLayout) {
			case Layout.TEXT_PDF:
				return layoutTextPDF;
			case Layout.TEXT_TEXT:
				return layoutTextText;
			case Layout.TEXT_TEXT_PDF:
				return layoutTextTextPDF;
		}
	}

	return (
		<>
			<Tabs
				onValueChange={(value) => setDesktopLayout(value as Layout)}
				defaultValue={desktopLayout}
			>
				<TabsList>
					{Object.values(Layout).map((layout) => (
						<TabsTrigger value={layout}>
							{getLayoutLabel(layout)}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{getLayout()}

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
