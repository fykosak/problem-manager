import { TaskDashboard } from '@client/components/tasks/taskDashboard';
import { Button } from '@client/components/ui/button';
import { useUserRoles } from '@client/hooks/usePersonRoles';
import { acl } from '@server/acl/aclFactory';
import { Route } from './+types/tasks';
import { trpc, trpcOutputTypes } from '@client/trpc';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@client/components/ui/card';
import { Badge } from '@client/components/ui/badge';
import { ProgressWork } from '@client/components/ui/progressWork';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const series = await trpc.contest.series.query({
		contestSymbol: params.contest,
		contestYear: Number(params.year),
	});
	return { series };
}

function Problem({
	problem,
}: {
	problem: trpcOutputTypes['contest']['series'][0]['problems'][0];
}) {
	const workStats = new Map<string, number>();
	for (const work of problem.work) {
		const currentCount = workStats.get(work.state) ?? 0;
		workStats.set(work.state, currentCount + 1);
	}

	return (
		<Card className="hover:bg-accent">
			<CardHeader>
				<CardTitle className="flex flex-row justify-between items-center gap-2">
					{problem.metadata.name.cs}
					<Badge className="bg-green-500">{problem.type.label}</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ProgressWork workStats={workStats} />
			</CardContent>
		</Card>
	);
}

function Series({
	series,
}: {
	series: trpcOutputTypes['contest']['series'][0];
}) {
	return (
		<div>
			<h2>série {series.label}</h2>
			<div className="flex flex-col gap-2">
				{series.problems.map((problem) => (
					<Problem key={problem.problemId} problem={problem} />
				))}
			</div>
		</div>
	);
}

export default function Tasks({ params, loaderData }: Route.ComponentProps) {
	const roles = useUserRoles();
	return (
		<>
			{acl.isAllowed(
				roles.contestRole[params.contest],
				'series',
				'edit'
			) && <Button>Edit</Button>}
			{/*<TaskDashboard />*/}
			<div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
				{loaderData.series.map((series) => (
					<Series key={series.seriesId} series={series} />
				))}
			</div>
		</>
	);
}
