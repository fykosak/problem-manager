import { UniqueIdentifier, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from './task';

export function Series({ id, items }: { id: UniqueIdentifier, items: UniqueIdentifier[] }) {
	const { isOver, setNodeRef } = useDroppable({
		id: id
	})

	return (
		<SortableContext
			items={items}
			strategy={verticalListSortingStrategy}
		>
			<div className="border border-2 bg-secondary w-1/4" ref={setNodeRef}>
				{items.map(id => <Task key={id} id={id} />)}
			</div>
		</SortableContext>
	);
}
