import { UniqueIdentifier, useDroppable } from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMemo } from 'react';

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@client/components/ui/card';
import { trpcOutputTypes } from '@client/trpc';

import { Problem } from './problem';

export function Series({
	id,
	items,
	series,
}: {
	id: UniqueIdentifier;
	// items need to be as a separate prop for rerendering to work correctly
	items: trpcOutputTypes['series']['list'][0]['problems'];
	series: trpcOutputTypes['series']['list'][0];
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
			<Card ref={setNodeRef} className="w-1/6">
				<CardHeader>
					<CardTitle>série {series.label}</CardTitle>
				</CardHeader>
				<CardContent className="p-2">{problemComponents}</CardContent>
			</Card>
		</SortableContext>
	);
}
