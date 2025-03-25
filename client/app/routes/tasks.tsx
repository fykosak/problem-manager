import { Link } from 'react-router';

import { acl } from '@server/acl/aclFactory';

import { ProblemDashboard } from '@client/components/tasks/dashboard/problemDashboard';
import { Button } from '@client/components/ui/button';
import { useUserRoles } from '@client/hooks/usePersonRoles';
import { trpc } from '@client/trpc';

import { Route } from './+types/tasks';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const series = await trpc.series.list.query({
		contestSymbol: params.contest,
		contestYear: Number(params.year),
	});
	return { series };
}

export default function Tasks({ params, loaderData }: Route.ComponentProps) {
	const personRoles = useUserRoles();
	return (
		<>
			<div className="space-x-2 my-2">
				{acl.isAllowedContest(
					personRoles,
					params.contest,
					'series',
					'edit'
				) && (
					<Link to="task-ordering">
						<Button>Order tasks</Button>
					</Link>
				)}
				{acl.isAllowedContest(
					personRoles,
					params.contest,
					'series',
					'create'
				) && (
					<Link to="series/create">
						<Button>Add series</Button>
					</Link>
				)}
			</div>
			<ProblemDashboard series={loaderData.series} />
		</>
	);
}
