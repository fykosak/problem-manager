import { UniqueIdentifier, useDroppable } from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Problem } from './problem';
import { trpcOutputTypes } from '@client/trpc';
import { useMemo } from 'react';

export function Series({
	id,
	items,
}: {
	id: UniqueIdentifier;
	items: trpcOutputTypes['contest']['series'][0]['problems'];
}) {
	const { setNodeRef } = useDroppable({
		id: id,
	});

	const problemComponents = useMemo(() => {
		return items.map((problem) => (
			<Problem key={problem.problemId} problem={problem} />
		));
	}, [items]);

	return (
		<SortableContext
			items={items.map((problem) => problem.problemId)}
			strategy={verticalListSortingStrategy}
		>
			<div
				className="border border-2 bg-secondary w-1/4"
				ref={setNodeRef}
			>
				{problemComponents}
			</div>
		</SortableContext>
	);
}
