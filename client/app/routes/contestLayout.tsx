import { Outlet } from 'react-router';
import NavigationSuspense from '~/components/navigation/navigationSuspense';

export default function Layout() {
	return (
		<div className="2xl:container 2xl:mx-auto px-4 sm:px-6 lg:px-8">
			<NavigationSuspense>
				<Outlet />
			</NavigationSuspense>
		</div>
	);
}
