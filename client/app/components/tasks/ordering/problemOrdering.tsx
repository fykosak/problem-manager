import {
	CollisionDetection,
	DndContext,
	DragEndEvent,
	DragOverEvent,
	DragOverlay,
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Series } from './series';
import { trpc, trpcOutputTypes } from '@client/trpc';
import { Button } from '@client/components/ui/button';
import { toast } from 'sonner';
import { Problem } from './problem';

// Modified code from https://github.com/clauderic/dnd-kit/blob/e9215e820798459ae036896fce7fd9a6fe855772/stories/2%20-%20Presets/Sortable/MultipleContainers.tsx

export function ProblemOrdering({
	series,
}: {
	series: trpcOutputTypes['contest']['series'];
}) {
	//const [items, setItems] = useState<Groups>(
	//	series.reduce(
	//		(record, series) => ({
	//			...record,
	//			[series.seriesId]: getSeriesProblemIds(series),
	//		}),
	//		{}
	//	)
	//);

	const [items, setItems] =
		useState<trpcOutputTypes['contest']['series']>(series);

	const [activeItemId, setActiveItemId] = useState<UniqueIdentifier | null>(
		null
	);
	const [activeProblem, setActiveProblem] = useState<
		trpcOutputTypes['contest']['series'][0]['problems'][0] | null
	>(null);
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
					const containerSeries = items.find(
						(series) => series.seriesId === overId
					);

					if (!containerSeries) {
						throw new Error(`Container ${overId} does not exist`);
					}

					// If a container is matched and it contains items
					if (containerSeries.problems.length > 0) {
						// Return the closest droppable within that container
						overId = closestCenter({
							...args,
							droppableContainers:
								args.droppableContainers.filter(
									(container) =>
										container.id !== overId &&
										containerSeries.problems.some(
											(problem) =>
												problem.problemId ===
												container.id
										)
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
				console.log('recentlyMovedToNewContainer');
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
		const postData: Record<number, number[]> = {};
		try {
			for (const series of items) {
				postData[series.seriesId] = series.problems.map(
					(problem) => problem.problemId
				);
			}
			await trpc.contest.saveSeriesOrdering.mutate({
				series: postData,
			});
			toast.success('Ordering saved');
		} catch {
			toast.error('Error occured');
		}
	}

	function findContainer(id: UniqueIdentifier) {
		// id is a container id
		if (typeof id === 'string') {
			return series.find(
				(series) =>
					series.seriesId === Number(id.replace('series-', ''))
			);
		}

		return items.find((series) =>
			series.problems.some((problem) => problem.problemId === id)
		);
	}

	// handle the changes between containers
	function handleDragOver(event: DragOverEvent) {
		const { active, over } = event;
		const overId = over?.id;

		if (overId == null) {
			return;
		}

		const overSeries = findContainer(overId);
		const activeSeries = findContainer(active.id);

		if (!activeSeries || !overSeries) {
			return;
		}

		// if containers match, don't update the state
		if (activeSeries.seriesId === overSeries.seriesId) {
			return;
		}

		const overItems = overSeries.problems;

		const activeProblem = activeSeries.problems.find(
			(problem) => problem.problemId === active.id
		);

		if (!activeProblem) {
			throw new Error(`cannot find active problem ${active.id}`);
		}

		const overIndex = overSeries.problems.findIndex(
			(problem) => problem.problemId === overId
		);

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
				overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
		}

		recentlyMovedToNewContainer.current = true;

		const newItems = [];
		for (const series of items) {
			if (series.seriesId === activeSeries.seriesId) {
				series.problems = series.problems.filter(
					(problem) => problem.problemId !== active.id
				);
			}
			if (series.seriesId === overSeries.seriesId) {
				series.problems = [
					...series.problems.slice(0, newIndex),
					activeProblem,
					...series.problems.slice(newIndex, series.problems.length),
				];
			}
			newItems.push(series);
		}

		setItems(newItems);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		const activeSeries = findContainer(active.id);

		if (!activeSeries) {
			setActiveItemId(null);
			return;
		}

		const overId = over?.id;

		if (overId == null) {
			setActiveItemId(null);
			return;
		}

		const overSeries = findContainer(overId);

		if (overSeries) {
			const activeIndex = activeSeries.problems.findIndex(
				(problem) => problem.problemId === active.id
			);
			const overIndex = overSeries.problems.findIndex(
				(problem) => problem.problemId === overId
			);

			const newItems = [];
			for (const series of items) {
				if (series.seriesId === overSeries.seriesId) {
					series.problems = arrayMove(
						series.problems,
						activeIndex,
						overIndex
					);
				}
				newItems.push(series);
			}

			setItems(newItems);
		}

		setActiveItemId(null);
		setActiveProblem(null);
	}

	function handleDragCancel() {
		setActiveItemId(null);
		setActiveProblem(null);
	}

	return (
		<>
			<DndContext
				sensors={sensors}
				collisionDetection={collisionDetectionStrategy}
				onDragStart={({ active }) => {
					setActiveItemId(active.id);
					const container = findContainer(active.id);
					setActiveProblem(
						container?.problems.find(
							(problem) => problem.problemId === active.id
						) ?? null
					);
				}}
				onDragCancel={handleDragCancel}
				onDragAbort={handleDragCancel}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
			>
				<div className="flex gap-2">
					{items.map((series) => (
						<Series
							key={series.seriesId}
							id={'series-' + series.seriesId}
							items={series.problems}
						/>
					))}
				</div>
				{activeProblem &&
					createPortal(
						<DragOverlay>
							<Problem problem={activeProblem} isOverlay />
						</DragOverlay>,
						document.body
					)}
			</DndContext>
			<Button onClick={() => void save()}>Save</Button>
		</>
	);
}
