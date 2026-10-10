import { Link } from 'react-router';

import { getWorkStateColor } from '@client/components/tasks/workComponent';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@client/components/ui/table';

import { getProblemName } from './helpers';
import { Problem, Work, WorkConfig, WorkGroupConfig, WorkRow } from './types';

export function getPeople(work: Work) {
	return work.people
		.map(({ person }) => `${person.firstName} ${person.lastName}`)
		.join(', ');
}

export function getWorkGroups(
	problems: Problem[],
	workConfig: WorkConfig | undefined
): WorkGroupConfig[] {
	const actualGroups = new Map<string | null, Work[]>();
	for (const problem of problems) {
		for (const work of problem.work) {
			const works = actualGroups.get(work.group) ?? [];
			works.push(work);
			actualGroups.set(work.group, works);
		}
	}

	const groups: WorkGroupConfig[] = (workConfig ?? []).map(
		(configuredGroup) => ({
			groupName: configuredGroup.groupName,
			items: configuredGroup.items,
		})
	);
	const configuredNames = new Set(groups.map((group) => group.groupName));

	for (const [groupName, works] of actualGroups) {
		if (configuredNames.has(groupName)) continue;
		groups.push({
			groupName,
			items: Array.from(
				new Map(works.map((work) => [work.label, work]))
			).map(([name]) => ({ name, optional: false })),
		});
	}

	return groups;
}

export function WorkGroupTable({
	group,
	rows,
	items,
}: {
	group: string | null;
	rows: WorkRow[];
	items: WorkConfig[number]['items'];
}) {
	return (
		<div className="mb-6">
			<h2 className="mb-2">{group ?? 'Ostatní'}</h2>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Úloha</TableHead>
						{items.map((item) => (
							<TableHead key={item.name}>{item.name}</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map(({ problem, works }) => {
						const workByLabel = new Map(
							works.map((work) => [work.label, work])
						);
						return (
							<TableRow key={problem.problemId}>
								<TableCell>
									<Link
										to={`../task/${problem.problemId}`}
										className="hover:underline"
									>
										{problem.seriesOrder}.{' '}
										{getProblemName(problem.metadata)}
									</Link>
								</TableCell>
								{items.map((item) => {
									const work = workByLabel.get(item.name);
									return (
										<TableCell
											key={item.name}
											className={
												work
													? getWorkStateColor(
															work.state
														)
													: undefined
											}
										>
											{work ? getPeople(work) || '–' : ''}
										</TableCell>
									);
								})}
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
