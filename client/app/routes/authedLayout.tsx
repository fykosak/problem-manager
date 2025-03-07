import { Button } from '@client/components/ui/button';
import { useAuth } from 'react-oidc-context';
import { Outlet } from 'react-router';

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
		return (
			<Button onClick={() => void auth.signinRedirect()}>Log in</Button>
		);
	}

	if (auth.error) {
		return <div>Oops... {auth.error.message}</div>;
	}

	return <Outlet />;
}
