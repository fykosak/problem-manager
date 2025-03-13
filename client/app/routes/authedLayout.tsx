import { useAuth } from 'react-oidc-context';
import { Navigate, Outlet } from 'react-router';
import { Route } from './+types/authedLayout';
import { TRPCClientError } from '@trpc/client';

function saveLoginRedirectUrl() {
	localStorage.setItem(
		'loginRedirect',
		location.pathname + location.search + location.hash
	);
}

export default function Layout() {
	console.log('render authedLayout');
	const auth = useAuth();

	if (auth.isLoading) {
		return <p>Loading auth</p>;
	}

	if (!auth.isAuthenticated) {
		saveLoginRedirectUrl();
		return <Navigate to="/login" />;
	}

	return <Outlet />;
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
