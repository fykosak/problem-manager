import { Outlet } from 'react-router';
import NavigationBar from '@client/components/navigation/navigationBar';
import { Route } from './+types/layout';
import { trpc } from '@client/trpc';
import { TRPCError } from '@trpc/server';

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

export default function Layout({ loaderData }: Route.ComponentProps) {
	if (!loaderData) {
		return <div>Failed to load data</div>;
	}
	return (
		<>
			<NavigationBar
				contests={loaderData.contests}
				selectedContest={loaderData.selectedContest}
				selectedYear={loaderData.selectedYear}
			/>
			<Outlet />
		</>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	if (error instanceof TRPCError) {
		if (error.message === 'UNAUTHORIZED') {
			return (
				<main className="pt-16 p-4 container mx-auto">
					<h1>UNAUTHORIZED</h1>
					<p>You cannot access this site</p>
				</main>
			);
		}
	}
}
