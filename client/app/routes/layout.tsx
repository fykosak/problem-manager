import { Suspense } from "react";
import { Outlet, useNavigation } from "react-router";
import NavigationBar from "~/components/navigationBar";

function Loading() {
	return <p>Loading</p>;
}

export default function Layout() {
	const navigation = useNavigation();
	const isNavigating = Boolean(navigation.location);

	let content;
	if (isNavigating) {
		content = <Loading />;
	} else {
		content = <Outlet />;
	}

	return <>
		<NavigationBar />
		{content}
	</>;
}
