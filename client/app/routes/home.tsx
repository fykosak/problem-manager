import NavigationBar from '@client/components/navigation/navigationBar';
import { trpc, trpcOutputTypes } from '@client/trpc';
import { Route } from './+types/home';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@client/components/ui/card';
import {
	getWorkStateColor,
	getWorkStateLabel,
} from '@client/components/tasks/workComponent';
import { Badge } from '@client/components/ui/badge';
import { NavLink } from 'react-router';

export async function clientLoader() {
	console.log('home client loader');
	const work = {
		waiting: await trpc.person.work.query('waiting'),
		todo: await trpc.person.work.query('todo'),
		pending: await trpc.person.work.query('pending'),
	};
	const activeOrganizerContestYears =
		await trpc.person.activeContestYears.query();
	const currentContestYears = await trpc.contest.currentContests.query();
	return { work, activeOrganizerContestYears, currentContestYears };
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
	works,
	currentContestYears,
}: {
	works: trpcOutputTypes['person']['work'];
	currentContestYears: trpcOutputTypes['contest']['currentContests'];
}) {
	if (works.length === 0) {
		return <Badge>No work found</Badge>;
	}
	return (
		<div className="flex flex-col md:flex-row flex-wrap gap-2">
			{works.map((work) => (
				<WorkItem
					key={work.person_work.personWorkId}
					work={work}
					currentContestYears={currentContestYears}
				/>
			))}
		</div>
	);
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const navLinks = loaderData.activeOrganizerContestYears.map(
		(contestYear) => ({
			name: contestYear.contest.name,
			link:
				'/' +
				contestYear.contest.symbol +
				'/' +
				contestYear.contest_year.year,
		})
	);
	return (
		<>
			<NavigationBar links={navLinks} />
			<main className="container mx-auto">
				<h1>Work to be done</h1>
				<WorkGroup
					works={loaderData.work.todo}
					currentContestYears={loaderData.currentContestYears}
				/>
				<h1>Work waiting to be finished</h1>
				<WorkGroup
					works={loaderData.work.pending}
					currentContestYears={loaderData.currentContestYears}
				/>
				<h1>Waiting work</h1>
				<WorkGroup
					works={loaderData.work.waiting}
					currentContestYears={loaderData.currentContestYears}
				/>
			</main>
		</>
	);
}
