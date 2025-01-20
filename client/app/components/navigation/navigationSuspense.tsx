import { useNavigation } from "react-router";

function Loading() {
	return <p>Loading</p>;
}

export default function NavigationSuspense({ children }: { children: React.ReactNode }) {
	const navigation = useNavigation();
	const isNavigating = Boolean(navigation.location);

	if (isNavigating) {
		return <Loading />;
	}

	return <>{children}</>;
}
