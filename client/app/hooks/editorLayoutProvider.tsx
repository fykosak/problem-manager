import { createContext, useContext, useRef, useState } from 'react';

import { Layout } from '@client/components/editor/layoutEnum';
import { trpcOutputTypes } from '@client/trpc';

type TextData = {
	textsById: Map<number, trpcOutputTypes['problem']['texts'][0]>;
	textsByType: Map<string, trpcOutputTypes['problem']['texts']>;
};

const EditorLayoutContext = createContext<{
	textData: TextData;
	selectedTextIds: Map<string, number>;
	setSelectedTextId: (container: string, textId: number | null) => void;
	containerRefs: Map<string, HTMLDivElement>;
	setContainerRef: (container: string, node: HTMLDivElement | null) => void;
	desktopLayout: Layout;
	setDesktopLayout: (layout: Layout) => void;
	buildFunctions: Map<number, () => Promise<void>>;
	setBuildFunction: (
		textId: number,
		buildFunction: () => Promise<void>
	) => void;
} | null>(null);

export function EditorLayoutProvider({
	textData,
	children,
}: {
	textData: TextData;
	children: React.ReactNode;
}) {
	const [selectedTextIds, setSelectedTextIds] = useState(
		new Map<string, number>()
	);

	const [desktopLayout, setDesktopLayout] = useState<Layout>(Layout.TEXT_PDF);

	function setSelectedTextId(container: string, textId: number | null) {
		setSelectedTextIds((oldMap) => {
			const newMap = new Map(oldMap);

			if (!textId) {
				newMap.delete(container);
			} else {
				newMap.set(container, textId);
			}

			return newMap;
		});
	}

	const containerRefs = useRef(new Map<string, HTMLDivElement>());

	function setContainerRef(container: string, node: HTMLDivElement | null) {
		const refMap = containerRefs.current;
		if (node) {
			refMap.set(container, node);
		} else {
			refMap.delete(container);
		}
	}

	function setDesktopLayoutSanitized(newLayout: Layout) {
		// sanitize text2 to not cause collisions
		if (
			desktopLayout === Layout.TEXT_PDF &&
			(newLayout === Layout.TEXT_TEXT_PDF ||
				newLayout === Layout.TEXT_TEXT)
		) {
			const text1TextId = selectedTextIds.get('text1');
			const text2TextId = selectedTextIds.get('text2');
			if (text1TextId === text2TextId) {
				setSelectedTextId('text2', null);
			}
		}

		setDesktopLayout(newLayout);
	}

	const buildFunctions = new Map<number, () => Promise<void>>();
	function setBuildFunction(
		textId: number,
		buildFunction: () => Promise<void>
	) {
		buildFunctions.set(textId, buildFunction);
	}

	return (
		<EditorLayoutContext.Provider
			value={{
				selectedTextIds,
				setSelectedTextId,
				textData,
				containerRefs: containerRefs.current,
				setContainerRef,
				desktopLayout,
				setDesktopLayout: setDesktopLayoutSanitized,
				buildFunctions,
				setBuildFunction,
			}}
		>
			{children}
		</EditorLayoutContext.Provider>
	);
}

export function useEditorLayout() {
	const context = useContext(EditorLayoutContext);

	if (!context) {
		throw new Error('useEditorLayout is null');
	}

	return context;
}
