import { Outlet } from 'react-router';

import NavigationBar from '@client/components/navigation/navigationBar';
import { trpc } from '@client/trpc';

import { Route } from './+types/base.layout';

export async function clientLoader() {
	const activeOrganizerContestYears =
		await trpc.person.activeContestYears.query();
	return { activeOrganizerContestYears };
}

export default function BaseLayout({ loaderData }: Route.ComponentProps) {
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
			<main className="container mx-auto my-2">
				<Outlet />
			</main>
		</>
	);
}
