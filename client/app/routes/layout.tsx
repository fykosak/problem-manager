import { Outlet } from 'react-router';
import { Route } from './+types/layout';
import { trpc } from '@client/trpc';
import ContestNavigationBar from '@client/components/navigation/contestNavigationBar';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const contests = await trpc.getContests.query();

	const selectedContest = contests.find(
		(contest) => contest.symbol === params.contest
	);
	if (!selectedContest) {
		throw new Error('Contest does not exist');
	}

	const selectedYear = selectedContest.years.find(
		(year) => year.year === parseInt(params.year)
	);
	if (!selectedYear) {
		throw new Error('Contest year does not exist');
	}

	return { contests, selectedContest, selectedYear };
}

export function meta({ data }: Route.MetaArgs) {
	return [
		{ title: data.selectedContest.name + ' ' + data.selectedYear.year },
	];
}

export default function Layout({ loaderData }: Route.ComponentProps) {
	if (!loaderData) {
		return <div>Failed to load data</div>;
	}
	return (
		<>
			<ContestNavigationBar
				contests={loaderData.contests}
				selectedContest={loaderData.selectedContest}
				selectedYear={loaderData.selectedYear}
			/>
			<Outlet />
		</>
	);
}
