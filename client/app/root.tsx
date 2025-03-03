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
import { ThemeProvider } from './components/themeProvider';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from 'react-oidc-context';
import { Button } from './components/ui/button';
import config from './config';

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

const oidcConfig = {
	authority: config.OIDC_AUTHORITY_URL,
	client_id: config.OIDC_CLIENT_ID,
	onSigninCallback: (): void => {
		window.history.replaceState(
			{},
			document.title,
			window.location.pathname
		);
	},
};

export function Layout({ children }: { children: React.ReactNode }) {
	const { pathname, hash, search } = useLocation();
	const rootUrl = config.ROOT_URL;
	let redirectUri = rootUrl + pathname;
	if (hash) {
		redirectUri += hash;
	}
	if (search) {
		redirectUri += search;
	}

	return (
		<AuthProvider {...{ ...oidcConfig, redirect_uri: redirectUri }}>
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
		</AuthProvider>
	);
}

export default function App() {
	const auth = useAuth();

	switch (auth.activeNavigator) {
		case 'signinSilent':
			return <div>Signing you in...</div>;
		case 'signoutRedirect':
			return <div>Signing you out...</div>;
	}

	if (auth.isLoading) {
		return <div>Loading...</div>;
	}

	if (auth.error) {
		return <div>Oops... {auth.error.message}</div>;
	}

	if (!auth.isAuthenticated) {
		return (
			<Button onClick={() => void auth.signinRedirect()}>Log in</Button>
		);
	}

	return <Outlet />;
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
