import { useEffect, useState } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@client/components/ui/tabs';
import { useEditorLayout } from '@client/hooks/editorLayoutProvider';

/**
 * @param excludedContainers List of other containers which value should not be
 * able to be selected.
 */
export function TextTypeSelector({
	containerName,
	excludedContainers = [],
}: {
	key: React.Key; // require the key prop for correct rerendering when changing layouts
	containerName: string;
	excludedContainers?: string[];
}) {
	const { textData, setSelectedTextId, selectedTextIds } = useEditorLayout();

	const excludedTextIds = new Set<number>();
	for (const container of excludedContainers) {
		const textId = selectedTextIds.get(container);
		if (textId) {
			excludedTextIds.add(textId);
		}
	}

	// types that should not be selectable because no languages are available
	const unselectableTypes = new Set<string>();
	for (const [type, texts] of textData.textsByType) {
		let isEmpty = true;
		for (const text of texts) {
			if (!excludedTextIds.has(text.textId)) {
				isEmpty = false;
				break;
			}
		}
		if (isEmpty) {
			unselectableTypes.add(type);
		}
	}

	function getInitialValues() {
		// find currently selected text
		const selectedTextId = selectedTextIds.get(containerName);

		if (selectedTextId) {
			if (excludedTextIds.has(selectedTextId)) {
				return { type: 'task', lang: undefined };
			}

			const text = textData.textsById.get(selectedTextId);
			if (text) {
				return { type: text.type, lang: text.lang };
			}
		}

		// default to first available
		for (const text of textData.textsById.values()) {
			if (excludedTextIds.has(text.textId)) {
				continue;
			}
			return { type: text.type, lang: text.lang };
		}

		return { type: 'task', lang: undefined };
	}

	const { type: initialType, lang: initialLang } = getInitialValues();

	const [selectedTextType, setSelectedTextType] =
		useState<string>(initialType);
	const [selectedLang, setSelectedLang] = useState<string | undefined>(
		initialLang
	);

	// set selected text id on selection change
	useEffect(() => {
		const selectedText = textData.textsByType
			.get(selectedTextType)
			?.find((text) => text.lang === selectedLang);
		if (selectedText) {
			setSelectedTextId(containerName, selectedText.textId);
		}
	}, [selectedTextType, selectedLang]);

	/**
	 * Set selected type.
	 * Check if the selected combination of type and lang wont resolve to
	 * selecting something in `excludedTextIds`.
	 */
	function selectType(type: string) {
		const selectedText = textData.textsByType
			.get(type)
			?.find((text) => text.lang === selectedLang);
		if (!selectedText) {
			return;
		}

		// text not excluded, so ok to set
		if (!excludedTextIds.has(selectedText.textId)) {
			setSelectedTextType(type);
			return;
		}

		// text is excluded, so choose other lang from the text type
		const textsOfType = textData.textsByType.get(type);
		if (!textsOfType) {
			return;
		}

		for (const text of textsOfType) {
			if (!excludedTextIds.has(text.textId)) {
				setSelectedLang(text.lang);
				setSelectedTextType(text.type);
				return;
			}
		}

		// no viable lang
		return;
	}

	return (
		<div className="flex flex-row gap-2">
			<Tabs onValueChange={selectType} value={selectedTextType}>
				<TabsList>
					{Array.from(textData.textsByType.keys()).map((type) => (
						<TabsTrigger key={type} value={type}>
							{type}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			<Tabs onValueChange={setSelectedLang} value={selectedLang}>
				<TabsList>
					{textData.textsByType.get(selectedTextType)?.map((text) => (
						<TabsTrigger
							key={text.lang}
							value={text.lang}
							disabled={excludedTextIds.has(text.textId)}
						>
							{text.lang}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</div>
	);
}
