import { Outlet } from 'react-router';

import NavigationBar from '@client/components/navigation/navigationBar';
import NavigationSuspense from '@client/components/navigation/navigationSuspense';

export default function BaseLayout() {
	return (
		<>
			<NavigationBar links={[]} />
			<main className="container mx-auto my-2 px-4">
				<NavigationSuspense>
					<Outlet />
				</NavigationSuspense>
			</main>
		</>
	);
}
