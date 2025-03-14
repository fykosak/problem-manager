import { Outlet } from 'react-router';
import NavigationSuspense from '@client/components/navigation/navigationSuspense';

export default function Layout() {
	return (
		<div className="container mx-auto px-4 sm:px-6 lg:px-8">
			<NavigationSuspense>
				<Outlet />
			</NavigationSuspense>
		</div>
	);
}
