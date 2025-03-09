import { RouteConfigEntry } from '@react-router/dev/routes';
import { matchRoutes, useLocation } from 'react-router';
import routes from '@client/routes';

export default function useCurrentRoute() {
	const location = useLocation();
	function getFlatRoutes(routes: RouteConfigEntry[]) {
		const paths: { path: string }[] = [];
		for (const entry of routes) {
			if (entry.path) {
				paths.push({ path: entry.path });
			}
			if (entry.children) {
				const subpaths = getFlatRoutes(entry.children);
				for (const subpath of subpaths) {
					paths.push({
						path: entry.path
							? entry.path + '/' + subpath.path
							: subpath.path,
					});
				}
			}
		}
		return paths;
	}

	const routeMatches = matchRoutes(getFlatRoutes(routes), location.pathname);
	if (routeMatches === null || routeMatches.length === 0) {
		return null;
	}

	return routeMatches[0];
}
