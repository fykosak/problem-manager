import { NavLink } from 'react-router';

import {
	getWorkStateColor,
	getWorkStateLabel,
} from '@client/components/tasks/workComponent';
import { Badge } from '@client/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@client/components/ui/card';
import { trpc, trpcOutputTypes } from '@client/trpc';

import { Route } from './+types/index';

export async function clientLoader() {
	const work = {
		waiting: await trpc.person.work.query('waiting'),
		todo: await trpc.person.work.query('todo'),
		pending: await trpc.person.work.query('pending'),
	};
	const currentContestYears = await trpc.contest.currentContests.query();
	return { work, currentContestYears };
}

function WorkItem({
	work,
	currentContestYears,
}: {
	work: trpcOutputTypes['person']['work'][0];
	currentContestYears: trpcOutputTypes['contest']['currentContests'];
}) {
	let link;
	if (work.contest_year) {
		link = `/${work.contest?.symbol}/${work.contest_year.year}/task/${work.problem.problemId}`;
	} else {
		const contestYear = currentContestYears.find(
			(contestYear) =>
				contestYear.contest.contestId === work.contest?.contestId
		);
		if (!contestYear) {
			throw new Error('Contest does not have an active year');
		}
		link = `/${contestYear.contest.symbol}/${contestYear.contest_year.year}/task/${work.problem.problemId}`;
	}

	return (
		<NavLink to={link}>
			<Card className="hover:bg-accent">
				<CardHeader>
					<CardTitle className="flex flex-row justify-between gap-2">
						{work.work.label}
						<Badge className={getWorkStateColor(work.work.state)}>
							{getWorkStateLabel(work.work.state)}
						</Badge>
					</CardTitle>
					{work.problem.seriesId && (
						<CardDescription>
							{work.contest?.name} {work.contest_year?.year} -
							série {work.series?.label}
						</CardDescription>
					)}
					{work.problem.contestId && (
						<CardDescription>{work.contest?.name}</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					{(work.problem.metadata.name as Record<string, string>).cs}{' '}
					- {work.work.group}
				</CardContent>
			</Card>
		</NavLink>
	);
}

function WorkGroup({
	header,
	works,
	currentContestYears,
}: {
	header: string;
	works: trpcOutputTypes['person']['work'];
	currentContestYears: trpcOutputTypes['contest']['currentContests'];
}) {
	if (works.length === 0) {
		return null;
	}
	return (
		<>
			<h1>{header}</h1>
			<div className="flex flex-col md:flex-row flex-wrap gap-2">
				{works.map((work) => (
					<WorkItem
						key={work.person_work.personWorkId}
						work={work}
						currentContestYears={currentContestYears}
					/>
				))}
			</div>
		</>
	);
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const workCount = Object.values(loaderData.work).reduce(
		(sum, works) => sum + works.length,
		0
	);

	if (workCount === 0) {
		return <Badge>No work found</Badge>;
	}

	return (
		<>
			<WorkGroup
				header={'Korektury potřeba udělat'}
				works={loaderData.work.todo}
				currentContestYears={loaderData.currentContestYears}
			/>
			<WorkGroup
				header={'Rozpracované korektury na dokončení'}
				works={loaderData.work.pending}
				currentContestYears={loaderData.currentContestYears}
			/>
			<WorkGroup
				header={'Korektury čekající na jiné korektury'}
				works={loaderData.work.waiting}
				currentContestYears={loaderData.currentContestYears}
			/>
		</>
	);
}
