import { useEditorLayout } from '@client/hooks/editorLayoutProvider';

export function EditorComponentContainer({
	containerName,
}: {
	containerName: string;
}) {
	const { setContainerRef } = useEditorLayout();
	return (
		<div
			ref={(node) => setContainerRef(containerName, node)}
			className="h-full"
		/>
	);
}
