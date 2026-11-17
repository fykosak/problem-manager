import { RouteConfigEntry } from '@react-router/dev/routes';
import { matchRoutes, useLocation } from 'react-router';

import routes from '@client/routes';

/**
 * Gets all routes as a flat list from recursive traversal of defined routes.
 */
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

/**
 * Get route pattern from routes by specified pathname.
 */
export function matchCurrentRoute(pathname: string) {
	const routeMatches = matchRoutes(getFlatRoutes(routes), pathname);
	return routeMatches?.[0] ?? null;
}

/**
 * Hook to get route pattern by current URL location.
 */
export default function useCurrentRoute() {
	const location = useLocation();
	return matchCurrentRoute(location.pathname);
}
