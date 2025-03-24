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
import { useEditorLayout } from '@client/hooks/editorLayoutProvider';

import { EditorComponentContainer } from './editorElementContainer';
import { Layout } from './layoutEnum';
import { TextTypeSelector } from './textTypeSelector';

const MOBILE_WIDTH_THRESHOLD = 768;

export function EditorLayout({ problemId }: { problemId: number }) {
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

	const taskEditorRefs = useRef(new Map<number, HTMLDivElement>());
	const pdfComponentRefs = useRef(new Map<number, HTMLDivElement>());

	const { textData, selectedTextIds, containerRefs, desktopLayout } =
		useEditorLayout();

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

			// do not remount if it already is mounted
			if (container.firstChild === child) {
				return;
			}
			container.replaceChildren(child);
		}

		function appendComponentToContainer(
			containerName: string,
			componentRefs: Map<number, HTMLDivElement>
		) {
			const containerRef = containerRefs.get(containerName);

			const textId = selectedTextIds.get(containerName);
			if (!textId) {
				return; // TODO clean container
			}

			const componentRef = componentRefs.get(textId);
			appendChildRef(containerRef, componentRef);
		}

		// mobile layout
		if (isMobile) {
			if (activeTab === 'editor') {
				appendComponentToContainer('text1', taskEditorRefs.current);
			} else {
				appendComponentToContainer('pdf', pdfComponentRefs.current);
			}
		}

		// desktop layout
		if (desktopLayout === Layout.TEXT_PDF) {
			appendComponentToContainer('text1', taskEditorRefs.current);
			appendComponentToContainer('pdf', pdfComponentRefs.current);
		}
		if (desktopLayout === Layout.TEXT_TEXT) {
			appendComponentToContainer('text1', taskEditorRefs.current);
			appendComponentToContainer('text2', taskEditorRefs.current);
		}
		if (desktopLayout === Layout.TEXT_TEXT_PDF) {
			appendComponentToContainer('text1', taskEditorRefs.current);
			appendComponentToContainer('text2', taskEditorRefs.current);
			appendComponentToContainer('pdf', pdfComponentRefs.current);
		}
	}, [activeTab, isMobile, componentLoaded, selectedTextIds, desktopLayout]);

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
				<TextTypeSelector key="text1" containerName="text1" />
				<EditorComponentContainer
					containerName="text1"
					className="h-full"
				/>
			</TabsContent>
			<TabsContent value="pdf" className="grow">
				<TextTypeSelector key="pdf" containerName="pdf" />
				<EditorComponentContainer
					containerName="pdf"
					className="h-full"
				/>
			</TabsContent>
		</Tabs>
	);

	const layoutTextPDF = (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel className="flex flex-col">
				<TextTypeSelector key="text1" containerName="text1" />
				<EditorComponentContainer containerName="text1" />
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel className="flex flex-col">
				<TextTypeSelector key="pdf" containerName="pdf" />
				<EditorComponentContainer containerName="pdf" />
			</ResizablePanel>
		</ResizablePanelGroup>
	);

	const layoutTextText = (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel className="flex flex-col">
				<TextTypeSelector
					key="text1"
					containerName="text1"
					excludedContainers={['text2']}
				/>
				<EditorComponentContainer containerName="text1" />
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel className="flex flex-col">
				<TextTypeSelector
					key="text2"
					containerName="text2"
					excludedContainers={['text1']}
				/>
				<EditorComponentContainer containerName="text2" />
			</ResizablePanel>
		</ResizablePanelGroup>
	);

	const layoutTextTextPDF = (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel>
				<ResizablePanelGroup direction="vertical">
					<ResizablePanel className="flex flex-col">
						<TextTypeSelector
							key="text1"
							containerName="text1"
							excludedContainers={['text2']}
						/>
						<EditorComponentContainer containerName="text1" />
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel className="flex flex-col">
						<TextTypeSelector
							key="text2"
							containerName="text2"
							excludedContainers={['text1']}
						/>
						<EditorComponentContainer containerName="text2" />
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel className="flex flex-col">
				<TextTypeSelector key="pdf" containerName="pdf" />
				<EditorComponentContainer containerName="pdf" />
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
			{getLayout()}
			<div style={{ display: 'none' }}>
				{Array.from(textData.textsById.values()).map((text) => (
					<>
						<Editor
							textId={text.textId}
							key={'editor-' + text.textId}
							ref={(node) => {
								const refMap = taskEditorRefs.current;
								if (node) {
									refMap.set(text.textId, node);
								} else {
									refMap.delete(text.textId);
								}
							}}
						/>
						<TaskPdf
							problemId={problemId}
							textType={text.type}
							textLang={text.lang}
							key={'pdf-' + text.textId}
							ref={(node) => {
								const refMap = pdfComponentRefs.current;
								if (node) {
									refMap.set(text.textId, node);
								} else {
									refMap.delete(text.textId);
								}
							}}
						/>
					</>
				))}
			</div>
		</>
	);
}
