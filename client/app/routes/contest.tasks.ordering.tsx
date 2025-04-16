import { ProblemOrdering } from '@client/components/tasks/ordering/problemOrdering';
import { trpc } from '@client/trpc';

import { Route } from './+types/contest.tasks.ordering';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const series = await trpc.series.list.query({
		contestSymbol: params.contest,
		contestYear: Number(params.year),
	});
	return { series };
}

export default function TaskOrdering({ loaderData }: Route.ComponentProps) {
	return (
		<>
			<h1>Seřazení úloh</h1>
			<ProblemOrdering series={loaderData.series} />
		</>
	);
}
