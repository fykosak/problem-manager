import { createContext, useContext, useRef, useState } from 'react';

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

	function setSelectedTextId(container: string, textId: number | null) {
		const newMap = new Map(selectedTextIds);
		if (!textId) {
			newMap.delete(container);
		} else {
			newMap.set(container, textId);
		}
		setSelectedTextIds(newMap);
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

	return (
		<EditorLayoutContext.Provider
			value={{
				selectedTextIds,
				setSelectedTextId,
				textData,
				containerRefs: containerRefs.current,
				setContainerRef,
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
