import { useNavigation } from 'react-router';

import { Loader } from '../ui/loader';

function Loading() {
	return (
		<div className="flex w-full justify-center items-center my-2">
			<span className="inline-flex gap-1">
				<Loader /> Načítání
			</span>
		</div>
	);
}

export default function NavigationSuspense({
	children,
}: {
	children: React.ReactNode;
}) {
	const navigation = useNavigation();
	const isNavigating = Boolean(navigation.location);

	if (isNavigating) {
		return <Loading />;
	}

	return <>{children}</>;
}
