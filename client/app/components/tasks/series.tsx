import { UniqueIdentifier, useDroppable } from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task } from './task';
import { trpcOutputTypes } from '@client/trpc';

export function Series({
	id,
	items,
	problems,
}: {
	id: UniqueIdentifier;
	items: UniqueIdentifier[];
	problems: Map<
		number,
		trpcOutputTypes['contest']['series'][0]['problems'][0]
	>;
}) {
	const { setNodeRef } = useDroppable({
		id: id,
	});

	return (
		<SortableContext items={items} strategy={verticalListSortingStrategy}>
			<div
				className="border border-2 bg-secondary w-1/4"
				ref={setNodeRef}
			>
				{items.map((id) => (
					<Task key={id} id={id} problem={problems.get(id)} />
				))}
			</div>
		</SortableContext>
	);
}
