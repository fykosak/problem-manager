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

export async function clientLoader() {
	const work = {
		waiting: await trpc.person.work.query('waiting'),
		todo: await trpc.person.work.query('todo'),
		pending: await trpc.person.work.query('pending'),
	};
	const activeContestYears = await trpc.person.activeContestYears.query();
	return { work, activeContestYears };
}

function WorkItem({ work }: { work: trpcOutputTypes['person']['work'][0] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex flex-row justify-between gap-2">
					{work.work.label}
					<Badge className={getWorkStateColor(work.work.state)}>
						{getWorkStateLabel(work.work.state)}
					</Badge>
				</CardTitle>
				{work.problem.seriesId && (
					<CardDescription>
						{work.contest?.name} {work.contest_year?.year} - série{' '}
						{work.series?.label}
					</CardDescription>
				)}
				{work.problem.contestId && (
					<CardDescription>{work.contest?.name}</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				{(work.problem.metadata.name as Record<string, string>).cs} -{' '}
				{work.work.group}
			</CardContent>
		</Card>
	);
}

function WorkGroup({ works }: { works: trpcOutputTypes['person']['work'] }) {
	if (works.length === 0) {
		return <Badge>No work found</Badge>;
	}
	return (
		<div className="flex flex-col md:flex-row flex-wrap gap-2">
			{works.map((work) => (
				<WorkItem key={work.person_work.personWorkId} work={work} />
			))}
		</div>
	);
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const navLinks = loaderData.activeContestYears.map((contestYear) => ({
		name: contestYear.contest.name,
		link:
			'/' +
			contestYear.contest.symbol +
			'/' +
			contestYear.contest_year.year,
	}));
	return (
		<>
			<NavigationBar links={navLinks} />
			<main className="container mx-auto">
				<h1>Work to be done</h1>
				<WorkGroup works={loaderData.work.todo} />
				<h1>Work waiting to be finished</h1>
				<WorkGroup works={loaderData.work.pending} />
				<h1>Waiting work</h1>
				<WorkGroup works={loaderData.work.waiting} />
			</main>
		</>
	);
}
