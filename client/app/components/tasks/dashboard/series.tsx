import { Pen } from 'lucide-react';
import { NavLink } from 'react-router';

import { acl } from '@server/acl/aclFactory';

import { Badge } from '@client/components/ui/badge';
import { Button } from '@client/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@client/components/ui/card';
import { usePersonRoles } from '@client/hooks/usePersonRoles';
import { trpcOutputTypes } from '@client/trpc';

import { Problem } from './problem';

export function Series({
	series,
}: {
	series: trpcOutputTypes['series']['list'][0];
}) {
	const personRoles = usePersonRoles();
	return (
		<div className="md:w-80">
			<Card>
				<CardHeader className="p-4">
					<CardTitle className="flex flex-row gap-2 items-center justify-between">
						<h2 className="py-2">série {series.label}</h2>
						{acl.isAllowedContest(
							personRoles,
							series.contestYear.contest.symbol,
							'series',
							'edit'
						) && (
							<NavLink to={`series/${series.seriesId}/edit`}>
								<Button variant="outline">
									<Pen /> Upravit
								</Button>
							</NavLink>
						)}
					</CardTitle>
					<CardDescription>
						{series.release && (
							<div>
								Zveřejnění:{' '}
								{new Date(series.release).toLocaleString()}
							</div>
						)}
						{series.deadline && (
							<div>
								Deadline:{' '}
								{new Date(series.deadline).toLocaleString()}
							</div>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4">
					{series.problems.length === 0 ? (
						<Badge>Žádné úlohy</Badge>
					) : (
						<div className="flex flex-col gap-2">
							{series.problems.map((problem) => (
								<Problem
									key={problem.problemId}
									problem={problem}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
