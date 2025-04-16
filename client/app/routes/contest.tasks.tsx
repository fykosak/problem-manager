import { ListOrdered, Plus } from 'lucide-react';
import { Link } from 'react-router';

import { acl } from '@server/acl/aclFactory';

import { ProblemDashboard } from '@client/components/tasks/dashboard/problemDashboard';
import { Button } from '@client/components/ui/button';
import { usePersonRoles } from '@client/hooks/usePersonRoles';
import { trpc } from '@client/trpc';

import { Route } from './+types/contest.tasks';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const series = await trpc.series.list.query({
		contestSymbol: params.contest,
		contestYear: Number(params.year),
	});
	const contestYear = await trpc.contest.contestYear.query({
		contestSymbol: params.contest,
		contestYear: Number(params.year),
	});
	return { series, contestYear };
}

export default function Tasks({ params, loaderData }: Route.ComponentProps) {
	const personRoles = usePersonRoles();
	return (
		<>
			<div className="mb-4">
				<h1 className="pb-0">Úlohy</h1>
				<span className="font-semibold">
					ročník {loaderData.contestYear.year},{' '}
					{loaderData.contestYear.contest.name}
				</span>
			</div>
			<div className="my-2 flex flex-row gap-2 flex-wrap">
				{acl.isAllowedContest(
					personRoles,
					params.contest,
					'problem',
					'create'
				) && (
					<Button asChild>
						<Link to={'tasks/create'}>
							<Plus /> Navrhnout úlohu
						</Link>
					</Button>
				)}
				{acl.isAllowedContest(
					personRoles,
					params.contest,
					'series',
					'edit'
				) && (
					<Button asChild>
						<Link to="tasks/ordering">
							<ListOrdered />
							Seřadit úlohy
						</Link>
					</Button>
				)}
				{acl.isAllowedContest(
					personRoles,
					params.contest,
					'series',
					'create'
				) && (
					<Button asChild>
						<Link to="series/create">
							<Plus />
							Přidat sérii
						</Link>
					</Button>
				)}
			</div>
			<ProblemDashboard series={loaderData.series} />
		</>
	);
}
