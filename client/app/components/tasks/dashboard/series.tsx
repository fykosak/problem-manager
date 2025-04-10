import { Pen } from 'lucide-react';
import { NavLink } from 'react-router';

import { acl } from '@server/acl/aclFactory';

import { Badge } from '@client/components/ui/badge';
import { Button } from '@client/components/ui/button';
import { useUserRoles } from '@client/hooks/usePersonRoles';
import { trpcOutputTypes } from '@client/trpc';

import { Problem } from './problem';

export function Series({
	series,
}: {
	series: trpcOutputTypes['series']['list'][0];
}) {
	const personRoles = useUserRoles();
	return (
		<div className="md:w-80">
			<div className="my-2">
				<div className="flex flex-row gap-2 items-center">
					<h2 className="py-2">série {series.label}</h2>
					{acl.isAllowedContest(
						personRoles,
						series.contestYear.contest.symbol,
						'series',
						'edit'
					)}
					<NavLink to={`series/${series.seriesId}/edit`}>
						<Button variant="outline" size="icon">
							<Pen />
						</Button>
					</NavLink>
				</div>
				{series.release && (
					<div className="text-sm text-muted-foreground">
						Zveřejnění: {new Date(series.release).toLocaleString()}
					</div>
				)}
				{series.deadline && (
					<div className="text-sm text-muted-foreground">
						Deadline: {new Date(series.deadline).toLocaleString()}
					</div>
				)}
			</div>
			{series.problems.length === 0 ? (
				<Badge>Žádné úlohy</Badge>
			) : (
				<div className="flex flex-col gap-2">
					{series.problems.map((problem) => (
						<Problem key={problem.problemId} problem={problem} />
					))}
				</div>
			)}
		</div>
	);
}
