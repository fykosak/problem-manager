import { TaskDashboard } from '@client/components/tasks/taskDashboard';
import { trpc } from '@client/trpc';
import { Route } from './+types/taskOrdering';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const series = await trpc.contest.series.query({
		contestSymbol: params.contest,
		contestYear: Number(params.year),
	});
	return { series };
}

export default function TaskOrdering({ loaderData }: Route.ComponentProps) {
	return <TaskDashboard series={loaderData.series} />;
}
