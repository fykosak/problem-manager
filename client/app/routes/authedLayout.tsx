import { useAuth } from 'react-oidc-context';
import { Navigate, Outlet } from 'react-router';
import { Route } from './+types/authedLayout';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@client/trpc';
import { PersonRolesProvider } from '@client/hooks/personRolesProvider';

function saveLoginRedirectUrl() {
	localStorage.setItem(
		'loginRedirect',
		location.pathname + location.search + location.hash
	);
}

export async function clientLoader() {
	const roles = await trpc.person.roles.query();
	console.log(roles);
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
