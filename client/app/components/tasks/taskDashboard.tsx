import {
	CollisionDetection,
	DndContext,
	DragEndEvent,
	DragOverEvent,
	KeyboardSensor,
	PointerSensor,
	UniqueIdentifier,
	closestCenter,
	getFirstCollision,
	pointerWithin,
	rectIntersection,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Series } from '@client/components/tasks/series';
import { trpc, trpcOutputTypes } from '@client/trpc';
import { Button } from '../ui/button';
import { toast } from 'sonner';

type Groups = Record<number, number[]>;

// Modified code from https://github.com/clauderic/dnd-kit/blob/e9215e820798459ae036896fce7fd9a6fe855772/stories/2%20-%20Presets/Sortable/MultipleContainers.tsx

function getSeriesProblemIds(series: trpcOutputTypes['contest']['series'][0]) {
	let problemIds = [];
	for (const problem of series.problems) {
		problemIds.push(problem.problemId);
	}
	return problemIds;
}

export function TaskDashboard({
	series,
}: {
	series: trpcOutputTypes['contest']['series'];
}) {
	const problems = useMemo(() => {
		const problems = new Map<
			number,
			trpcOutputTypes['contest']['series'][0]['problems'][0]
		>();
		for (const oneSeries of series) {
			for (const problem of oneSeries.problems) {
				problems.set(problem.problemId, problem);
			}
		}
		return problems;
	}, [series]);
	const [items, setItems] = useState<Groups>(
		series.reduce(
			(record, series) => ({
				...record,
				[series.seriesId]: getSeriesProblemIds(series),
			}),
			{}
		)
	);

	const [activeItemId, setActiveItemId] = useState<UniqueIdentifier | null>(
		null
	);
	const lastOverId = useRef<UniqueIdentifier | null>(null);
	const recentlyMovedToNewContainer = useRef(false);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const collisionDetectionStrategy: CollisionDetection = useCallback(
		(args) => {
			// Start by finding any intersecting droppable
			const pointerIntersections = pointerWithin(args);
			const intersections =
				pointerIntersections.length > 0
					? // If there are droppables intersecting with the pointer, return those
						pointerIntersections
					: rectIntersection(args);
			let overId = getFirstCollision(intersections, 'id');

			if (overId != null) {
				// if overId is a group, find the nearest item
				if (overId in items) {
					const containerItems = items[overId];
					// If a container is matched and it contains items
					if (containerItems.length > 0) {
						// Return the closest droppable within that container
						overId = closestCenter({
							...args,
							droppableContainers:
								args.droppableContainers.filter(
									(container) =>
										container.id !== overId &&
										containerItems.includes(container.id)
								),
						})[0]?.id;
					}
				}

				lastOverId.current = overId;

				return [{ id: overId }];
			}

			// When a draggable item moves to a new container, the layout may shift
			// and the `overId` may become `null`. We manually set the cached `lastOverId`
			// to the id of the draggable item that was moved to the new container, otherwise
			// the previous `overId` will be returned which can cause items to incorrectly shift positions
			if (recentlyMovedToNewContainer.current) {
				lastOverId.current = activeItemId;
			}

			// If no droppable is matched, return the last match
			return lastOverId.current ? [{ id: lastOverId.current }] : [];
		},
		[activeItemId, items]
	);

	useEffect(() => {
		requestAnimationFrame(() => {
			recentlyMovedToNewContainer.current = false;
		});
	}, [items]);

	async function save() {
		try {
			await trpc.contest.saveSeriesOrdering.mutate({
				series: items,
			});
			toast.success('Ordering saved');
		} catch {
			toast.error('Error occured');
		}
	}

	return (
		<>
			<DndContext
				sensors={sensors}
				collisionDetection={collisionDetectionStrategy}
				onDragStart={({ active }) => {
					setActiveItemId(active.id);
				}}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
			>
				<div className="flex gap-2">
					{Object.keys(items).map((groupId) => (
						<Series
							key={groupId}
							id={groupId}
							items={items[groupId]}
							problems={problems}
						/>
					))}
				</div>
			</DndContext>
			<Button onClick={save}>Save</Button>
		</>
	);

	function findContainer(id: UniqueIdentifier) {
		// id is a container id
		if (id in items) {
			return id;
		}

		return Object.keys(items).find((key) => items[key].includes(id));
	}

	function handleDragOver(event: DragOverEvent) {
		const { active, over } = event;
		const overId = over?.id;

		if (overId == null) {
			return;
		}

		if (active.id in items) {
			return;
		}

		const overContainer = findContainer(overId);
		const activeContainer = findContainer(active.id);

		if (!activeContainer || !overContainer) {
			return;
		}

		if (activeContainer === overContainer) {
			return;
		}

		setItems((items) => {
			const activeItems = items[activeContainer];
			const overItems = items[overContainer];
			const overIndex = overItems.indexOf(overId);
			const activeIndex = activeItems.indexOf(active.id);

			let newIndex: number;

			if (overId in items) {
				newIndex = overItems.length + 1;
			} else {
				const isBelowOverItem =
					over &&
					active.rect.current.translated &&
					active.rect.current.translated.top >
						over.rect.top + over.rect.height;

				const modifier = isBelowOverItem ? 1 : 0;

				newIndex =
					overIndex >= 0
						? overIndex + modifier
						: overItems.length + 1;
			}

			recentlyMovedToNewContainer.current = true;

			return {
				...items,
				[activeContainer]: items[activeContainer].filter(
					(item) => item !== active.id
				),
				[overContainer]: [
					...items[overContainer].slice(0, newIndex),
					items[activeContainer][activeIndex],
					...items[overContainer].slice(
						newIndex,
						items[overContainer].length
					),
				],
			};
		});
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		const activeContainer = findContainer(active.id);

		if (!activeContainer) {
			setActiveItemId(null);
			return;
		}

		const overId = over?.id;

		if (overId == null) {
			setActiveItemId(null);
			return;
		}

		const overContainer = findContainer(overId);

		if (overContainer) {
			const activeIndex = items[activeContainer].indexOf(active.id);
			const overIndex = items[overContainer].indexOf(overId);

			if (activeIndex !== overIndex) {
				setItems((items) => ({
					...items,
					[overContainer]: arrayMove(
						items[overContainer],
						activeIndex,
						overIndex
					),
				}));
			}
		}

		setActiveItemId(null);
	}
}
