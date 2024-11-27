import { Outlet } from "react-router";
import NavigationBar from "~/components/navigationBar";

export default function Layout() {
	return <>
		<NavigationBar />
		<Outlet />
	</>;
}
