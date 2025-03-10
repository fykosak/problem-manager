import { Button } from '@client/components/ui/button';
import { useAuth } from 'react-oidc-context';
import { Outlet } from 'react-router';
import { Route } from './+types/authedLayout';
import { TRPCClientError } from '@trpc/client';
import Logo from '@client/components/ui/logo';

function LogIn() {
	const auth = useAuth();
	return (
		<div className="flex flex-col items-center justify-center w-full h-screen">
			<div className="flex flex-col items-center w-full md:max-w-md">
				<Logo className="h-48 my-5" />
				<Button
					className="self-stretch"
					onClick={() => void auth.signinRedirect()}
				>
					Log in
				</Button>
			</div>
		</div>
	);
}

export default function Layout() {
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

	if (!auth.isAuthenticated) {
		return <LogIn />;
	}

	if (auth.error) {
		return <div>Oops... {auth.error.message}</div>;
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
			//return (
			//	<main className="pt-16 p-4 container mx-auto">
			//		<h1>UNAUTHORIZED</h1>
			//		<p>You cannot access this site</p>
			//	</main>
			//);
			return <LogIn />;
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
