import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Badge } from '@client/components/ui/badge';
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@client/components/ui/card';
import { trpcOutputTypes } from '@client/trpc';

export function Problem({
	problem,
	isOverlay,
}: {
	problem: trpcOutputTypes['series']['list'][0]['problems'][0];
	isOverlay?: boolean;
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useSortable({ id: problem.problemId });

	const style = {
		transform: CSS.Transform.toString(transform),
	};

	return (
		<Card
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={
				'select-none' +
				(isOverlay ? ' border-2' : '') +
				(isDragging ? ' opacity-50' : '')
			}
		>
			<CardHeader>
				<CardTitle>
					{'name' in problem.metadata
						? // @ts-expect-error not defined metadata type
							'cs' in problem.metadata.name
							? (problem.metadata.name.cs as string) // TODO
							: ''
						: ''}
				</CardTitle>
				<CardDescription>
					<Badge className="bg-green-500 hover:bg-green-600">
						{problem.type.label}
					</Badge>
				</CardDescription>
			</CardHeader>
		</Card>
	);
}
