import { Outlet, useNavigation } from "react-router";
import NavigationBar from "~/components/navigationBar";
import { Route } from "./+types/layout";
import { trpc } from "~/trpc";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const contests = await trpc.getContests.query();

	const selectedContest = contests.find((contest) => contest.symbol === params.contest);
	if (!selectedContest) {
		throw new Error("Contest does not exist");
	}

	const selectedYear = selectedContest.years.find((year) => year.year === parseInt(params.year));
	if (!selectedYear) {
		throw new Error("Contest year does not exist");
	}

	return { contests, selectedContest, selectedYear };
}

function Loading() {
	return <p>Loading</p>;
}

export default function Layout({ loaderData }: Route.ComponentProps) {

	const navigation = useNavigation();
	const isNavigating = Boolean(navigation.location);
	let content;
	if (isNavigating) {
		content = <Loading />;
	} else {
		content = <Outlet />;
	}

	return <>
		<NavigationBar
			contests={loaderData.contests}
			selectedContest={loaderData.selectedContest}
			selectedYear={loaderData.selectedYear}
		/>
		{content}
	</>;
}
