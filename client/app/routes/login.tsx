import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router';

import { Button } from '@client/components/ui/button';
import Logo from '@client/components/ui/logo';

export default function Login() {
	const auth = useAuth();

	switch (auth.activeNavigator) {
		case 'signinRedirect':
		case 'signinSilent':
			return <div>Signing you in...</div>;
		case 'signoutRedirect':
			return <div>Signing you out...</div>;
	}

	if (auth.isLoading) {
		return <div>Loading...</div>;
	}

	if (auth.isAuthenticated) {
		console.log(localStorage.getItem('loginRedirect'));
		let loginRedirect = localStorage.getItem('loginRedirect') ?? '/';
		if (loginRedirect === '/login') {
			loginRedirect = '/';
		}
		console.log(loginRedirect);
		return <Navigate to={loginRedirect} />;
	}

	if (auth.error) {
		return <div>Oops... {auth.error.message}</div>;
	}

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
