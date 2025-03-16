import { Link } from 'react-router';

import { acl } from '@server/acl/aclFactory';

import { ProblemDashboard } from '@client/components/tasks/dashboard/problemDashboard';
import { Button } from '@client/components/ui/button';
import { useUserRoles } from '@client/hooks/usePersonRoles';
import { trpc } from '@client/trpc';

import { Route } from './+types/tasks';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const series = await trpc.contest.series.query({
		contestSymbol: params.contest,
		contestYear: Number(params.year),
	});
	return { series };
}

export default function Tasks({ params, loaderData }: Route.ComponentProps) {
	const roles = useUserRoles();
	return (
		<>
			{acl.isAllowed(
				roles.contestRole[params.contest],
				'series',
				'edit'
			) && (
				<Link to="task-ordering">
					<Button>Edit</Button>
				</Link>
			)}
			<ProblemDashboard series={loaderData.series} />
		</>
	);
}
