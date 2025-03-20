import { cn } from '@client/lib/utils';

import { FileListItem } from './fileListItem';

export function FileList({
	files,
	problemId,
	className,
}: {
	files: string[];
	problemId: number;
	className?: string;
}) {
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{files.map((file) => (
				<FileListItem
					key={file}
					problemId={problemId}
					filename={file}
				/>
			))}
		</div>
	);
}
