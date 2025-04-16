import { Outlet } from 'react-router';

import NavigationBar from '@client/components/navigation/navigationBar';

export default function BaseLayout() {
	return (
		<>
			<NavigationBar links={[]} />
			<main className="container mx-auto my-2">
				<Outlet />
			</main>
		</>
	);
}
