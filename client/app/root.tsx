import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
} from 'react-router';

import type { Route } from './+types/root';
import stylesheet from './app.css?url';
import { ThemeProvider } from './hooks/themeProvider';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from 'react-oidc-context';
import { setConfig } from './config';

export const links: Route.LinksFunction = () => [
	{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
	{
		rel: 'preconnect',
		href: 'https://fonts.gstatic.com',
		crossOrigin: 'anonymous',
	},
	{
		rel: 'stylesheet',
		href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
	},
	{ rel: 'stylesheet', href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider defaultTheme="system">
			<html lang="cs" className="h-full">
				<head>
					<meta charSet="utf-8" />
					<meta
						name="viewport"
						content="width=device-width, initial-scale=1"
					/>
					<Meta />
					<Links />
				</head>
				<body className="min-h-screen flex flex-col">
					{children}
					<Toaster />
					<ScrollRestoration />
					<Scripts />
				</body>
			</html>
		</ThemeProvider>
	);
}

export async function clientLoader() {
	const response = await fetch('/config.json');
	const json = (await response.json()) as Record<string, unknown>;
	const config = setConfig(json);
	return config;
}

export default function App({ loaderData }: Route.ComponentProps) {
	const config = loaderData;

	const { pathname, hash, search } = useLocation();
	const rootUrl = config.ROOT_URL;
	let redirectUri = rootUrl + pathname;
	if (hash) {
		redirectUri += hash;
	}
	if (search) {
		redirectUri += search;
	}

	const oidcConfig = {
		authority: config.OIDC_AUTHORITY_URL,
		client_id: config.OIDC_CLIENT_ID,
		redirect_uri: redirectUri,
		onSigninCallback: (): void => {
			window.history.replaceState(
				{},
				document.title,
				window.location.pathname
			);
		},
	};

	return (
		<AuthProvider {...oidcConfig}>
			<Outlet />
		</AuthProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = 'Oops!';
	let details = 'An unexpected error occurred.';
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? '404' : 'Error';
		details =
			error.status === 404
				? 'The requested page could not be found.'
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
