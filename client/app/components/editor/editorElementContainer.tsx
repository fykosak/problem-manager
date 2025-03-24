import { useEditorLayout } from '@client/hooks/editorLayoutProvider';
import { cn } from '@client/lib/utils';

export function EditorComponentContainer({
	containerName,
	className,
}: {
	containerName: string;
	className?: string;
}) {
	const { setContainerRef } = useEditorLayout();
	return (
		<div
			ref={(node) => setContainerRef(containerName, node)}
			className={cn('grow', className)}
		/>
	);
}
