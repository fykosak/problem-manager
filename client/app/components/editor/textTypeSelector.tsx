import { useEffect, useState } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@client/components/ui/tabs';
import { useEditorLayout } from '@client/hooks/editorLayoutProvider';

export function TextTypeSelector({ containerName }: { containerName: string }) {
	const { textData, setSelectedTextId } = useEditorLayout();

	const [selectedTextType, setSelectedTextType] = useState<string>(
		textData.textsByType.keys().next().value ?? 'task'
	);
	const [selectedLang, setSelectedLang] = useState<string | undefined>(
		selectedTextType
			? textData.textsByType.get(selectedTextType)?.at(0)?.lang
			: undefined
	);

	useEffect(() => {
		const selectedText = textData.textsByType
			.get(selectedTextType)
			?.find((text) => text.lang === selectedLang);
		if (selectedText) {
			setSelectedTextId(containerName, selectedText.textId);
		}
	}, [selectedTextType, selectedLang]);

	return (
		<div className="flex flex-row gap-2">
			<Tabs
				onValueChange={setSelectedTextType}
				defaultValue={selectedTextType}
			>
				<TabsList>
					{Array.from(textData.textsByType.keys()).map((type) => (
						<TabsTrigger key={type} value={type}>
							{type}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			<Tabs onValueChange={setSelectedLang} defaultValue={selectedLang}>
				<TabsList>
					{textData.textsByType.get(selectedTextType)?.map((text) => (
						<TabsTrigger key={text.lang} value={text.lang}>
							{text.lang}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</div>
	);
}
