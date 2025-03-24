import { createContext, useContext, useState } from 'react';

import { Layout } from '@client/components/editor/layoutEnum';

export const ProblemSidebarContext = createContext<{
	selectedLayout: Layout;
	setSelectedLayout: (layout: Layout) => void;
}>({
	selectedLayout: Layout.TEXT_PDF,
	setSelectedLayout: () => null,
});

export function ProblemSidebarProvider({
	children,
	...props
}: {
	children: React.ReactNode;
}) {
	const [selectedLayout, setSelectedLayout] = useState(Layout.TEXT_PDF);

	return (
		<ProblemSidebarContext.Provider
			{...props}
			value={{ selectedLayout, setSelectedLayout }}
		>
			{children}
		</ProblemSidebarContext.Provider>
	);
}

export function useProblemSidebar() {
	const context = useContext(ProblemSidebarContext);

	if (!context) {
		throw new Error('Problem sidebar should not be null');
	}

	return context;
}
