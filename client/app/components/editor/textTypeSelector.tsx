import { useEffect, useState } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@client/components/ui/tabs';
import { type trpcOutputTypes } from '@client/trpc';

export function TextTypeSelector({
	textsByType,
	setSelectedTextId,
}: {
	textsByType: Map<string, trpcOutputTypes['problem']['texts']>;
	setSelectedTextId: (textId: number) => void;
}) {
	const [selectedTextType, setSelectedTextType] = useState<string>(
		textsByType.keys().next().value ?? 'task'
	);
	const [selectedLang, setSelectedLang] = useState<string | undefined>(
		selectedTextType
			? textsByType.get(selectedTextType)?.at(0)?.lang
			: undefined
	);

	useEffect(() => {
		const selectedText = textsByType
			.get(selectedTextType)
			?.find((text) => text.lang === selectedLang);
		if (selectedText) {
			setSelectedTextId(selectedText.textId);
		}
	}, [selectedTextType]);

	return (
		<div className="flex flex-row gap-2">
			<Tabs
				onValueChange={setSelectedTextType}
				defaultValue={selectedTextType}
			>
				<TabsList>
					{Array.from(textsByType.keys()).map((type) => (
						<TabsTrigger key={type} value={type}>
							{type}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			<Tabs onValueChange={setSelectedLang} defaultValue={selectedLang}>
				<TabsList>
					{textsByType.get(selectedTextType)?.map((text) => (
						<TabsTrigger key={text.lang} value={text.lang}>
							{text.lang}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</div>
	);
}
