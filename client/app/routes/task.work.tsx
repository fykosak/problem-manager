import { ReactElement } from 'react';

import WorkComponent from '@client/components/tasks/workComponent';
import { trpc } from '@client/trpc';

import { Route } from './+types/task.work';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const work = await trpc.problem.work.query(Number(params.taskId));
	const people = await trpc.contest.organizers.query({
		contestSymbol: params.contest,
	});
	return { work, people };
}

export default function Work({ loaderData }: Route.ComponentProps) {
	const groups = new Map<string | null, ReactElement[]>();
	for (const work of loaderData.work) {
		if (!groups.has(work.group)) {
			groups.set(work.group, []);
		}

		groups.get(work.group)?.push(
			<div key={work.workId}>
				<WorkComponent work={work} organizers={loaderData.people} />
			</div>
		);
	}

	const groupElements = [];
	for (const [key, elements] of groups.entries()) {
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
