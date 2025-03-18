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
import { type trpcOutputTypes } from '@client/trpc';

import { EditorComponentContainer } from './editorElementContainer';
import { Layout, getLayoutLabel } from './layoutEnum';
import { TextTypeSelector } from './textTypeSelector';

const MOBILE_WIDTH_THRESHOLD = 768;

export function EditorLayout({
	problemId,
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

	const pdfContainerRef = useRef<HTMLDivElement>(null);
	const pdfComponentRef = useRef<HTMLDivElement>(null);

	const taskEditorRefs = useRef(new Map<number, HTMLDivElement>());

	const { textData, selectedTextIds, containerRefs } = useEditorLayout();

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

			if (container.firstChild === child) {
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
					containerRefs.get('text1'),
					getEditorRef(selectedTextIds.get('text1'))
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
				containerRefs.get('text1'),
				getEditorRef(selectedTextIds.get('text1'))
			);
			appendChildRef(containerRefs.get('pdf'), pdfComponentRef.current);
		}
		if (desktopLayout === Layout.TEXT_TEXT) {
			appendChildRef(
				containerRefs.get('text1'),
				getEditorRef(selectedTextIds.get('text1'))
			);
			appendChildRef(
				containerRefs.get('text2'),
				getEditorRef(selectedTextIds.get('text2'))
			);
		}
		if (desktopLayout === Layout.TEXT_TEXT_PDF) {
			appendChildRef(
				containerRefs.get('text1'),
				getEditorRef(selectedTextIds.get('text1'))
			);
			appendChildRef(
				containerRefs.get('text2'),
				getEditorRef(selectedTextIds.get('text2'))
			);
			appendChildRef(containerRefs.get('pdf'), pdfComponentRef.current);
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
				<EditorComponentContainer containerName="text1" />
			</TabsContent>
			<TabsContent value="pdf" className="grow">
				<EditorComponentContainer containerName="pdf" />
			</TabsContent>
		</Tabs>
	);

	const layoutTextPDF = (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel>
				<TextTypeSelector containerName="text1" />
				<EditorComponentContainer containerName="text1" />
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel>
				<TextTypeSelector containerName="pdf" />
				<EditorComponentContainer containerName="pdf" />
			</ResizablePanel>
		</ResizablePanelGroup>
	);

	const layoutTextText = (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel>
				<TextTypeSelector containerName="text1" />
				<EditorComponentContainer containerName="text1" />
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel>
				<TextTypeSelector containerName="text2" />
				<EditorComponentContainer containerName="text2" />
			</ResizablePanel>
		</ResizablePanelGroup>
	);

	const layoutTextTextPDF = (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel>
				<ResizablePanelGroup direction="vertical">
					<ResizablePanel>
						<TextTypeSelector containerName="text1" />
						<EditorComponentContainer containerName="text1" />
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel>
						<TextTypeSelector containerName="text2" />
						<EditorComponentContainer containerName="text2" />
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel>
				<TextTypeSelector containerName="pdf" />
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
