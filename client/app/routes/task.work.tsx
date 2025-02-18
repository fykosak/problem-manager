import { trpc } from '~/trpc';
import { Route } from './+types/task.work';
import WorkComponent from '~/components/tasks/workComponent';
import { ReactElement } from 'react';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const work = await trpc.problem.work.query(Number(params.taskId));
	const people = await trpc.contest.people.query(1); // TODO contest id
	return { work, people };
}

export default function Work({ loaderData }: Route.ComponentProps) {
	let groups = new Map<string | null, Array<ReactElement>>();
	for (let work of loaderData.work) {
		if (!groups.has(work.group)) {
			groups.set(work.group, []);
		}

		groups.get(work.group)?.push(
			<div key={work.workId}>
				<WorkComponent work={work} people={loaderData.people} />
			</div>
		);
	}

	let groupElements = [];
	for (let [key, elements] of groups.entries()) {
		groupElements.push(
			<div key={key} className="flex flex-col gap-2">
				{key}
				{elements}
			</div>
		);
	}

	return (
		<div className="flex flex-row justify-center px-4 sm:px-6 lg:px-8">
			<div>
				<h1>Korektury</h1>
				<div className="flex flex-col lg:flex-row gap-2 flex-wrap">
					{groupElements}
				</div>
			</div>
		</div>
	);
}
