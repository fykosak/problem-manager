import { trpcOutputTypes } from '@client/trpc';
import { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

export function Task({
	id,
	problem,
}: {
	id: UniqueIdentifier;
	problem: trpcOutputTypes['contest']['series'][0]['problems'][0];
}) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<Card ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<CardHeader>
				<CardTitle className="flex flex-row justify-between items-center gap-2">
					{problem.metadata.name.cs}
					<Badge className="bg-green-500">{problem.type.label}</Badge>
				</CardTitle>
			</CardHeader>
		</Card>
	);
}
