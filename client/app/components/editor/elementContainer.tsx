import { type trpcOutputTypes } from '@client/trpc';

import { TextTypeSelector } from './textTypeSelector';

export function ElementContainer({
	containerName,
	textData,
	containerRefs,
	setSelectedTextId,
}: {
	containerName: string;
	textData: Map<string, trpcOutputTypes['problem']['texts']>;
	containerRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
	setSelectedTextId: (container: string, textId: number) => void;
}) {
	return (
		<>
			<TextTypeSelector
				textsByType={textData}
				setSelectedTextId={(value) =>
					setSelectedTextId(containerName, value)
				}
			/>
			<div
				ref={(node) => {
					const refMap = containerRefs.current;
					if (node) {
						refMap.set(containerName, node);
					} else {
						refMap.delete(containerName);
					}
				}}
				className="h-full"
			/>
		</>
	);
}
