import { TRPCClientError } from '@trpc/client';
import { useAuth } from 'react-oidc-context';
import { Navigate, Outlet } from 'react-router';
import { redirect } from 'react-router';

import { PersonRolesProvider } from '@client/hooks/personRolesProvider';
import { getUser, trpc } from '@client/trpc';

import { Route } from './+types/authed.layout';

function saveLoginRedirectUrl() {
	localStorage.setItem(
		'loginRedirect',
		location.pathname + location.search + location.hash
	);
}

export async function clientLoader() {
	const user = getUser();
	if (!user || user.expired) {
		saveLoginRedirectUrl();
		return redirect('/login');
	}
	const roles = await trpc.person.roles.query();
	return { roles };
}

export default function Layout({ loaderData }: Route.ComponentProps) {
	const auth = useAuth();

	if (auth.isLoading) {
		return <p>Loading auth</p>;
	}

	if (!auth.isAuthenticated) {
		saveLoginRedirectUrl();
		return <Navigate to="/login" />;
	}

	return (
		<PersonRolesProvider value={loaderData.roles}>
			<Outlet />
		</PersonRolesProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	if (error instanceof TRPCClientError) {
		if (!error.data) {
			throw error;
		}

		// React router does not currentcly fully support middleware.
		// This means there is not way to globally check if user is
		// authenticated before a page load.
		// Client loader is trying to check, but when user navigates
		// to a site and the tokens are expired / non existend, it
		// still sends the trpc request because authed layout is
		// not rerendered

		// eslint-disable-next-line
		if (error.data.code === 'UNAUTHORIZED') {
			saveLoginRedirectUrl();
			return <Navigate replace to="/login" />;
		}

		// eslint-disable-next-line
		if (error.data.code === 'NOT_FOUND') {
			return (
				<main className="pt-16 p-4 container mx-auto">
					<h1>NOT FOUND</h1>
					<p>{error.message}</p>
				</main>
			);
		}
	}

	// bubble the error up if not handled
	throw error;
}
