import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router';

import { Button } from '@client/components/ui/button';
import { Loader } from '@client/components/ui/loader';
import Logo from '@client/components/ui/logo';

export default function Login() {
	const auth = useAuth();

	switch (auth.activeNavigator) {
		case 'signinRedirect':
		case 'signinSilent':
			return (
				<div className="flex flex-col items-center justify-center w-full h-screen">
					<span className="inline-flex gap-1">
						<Loader /> Přihlašování
					</span>
				</div>
			);
		case 'signoutRedirect':
			return (
				<div className="flex flex-col items-center justify-center w-full h-screen">
					<span className="inline-flex gap-1">
						<Loader /> Odhlašování
					</span>
				</div>
			);
	}

	if (auth.isLoading) {
		return (
			<div className="flex flex-col items-center justify-center w-full h-screen">
				<Loader />
			</div>
		);
	}

	if (auth.isAuthenticated) {
		let loginRedirect = localStorage.getItem('loginRedirect') ?? '/';
		if (loginRedirect === '/login') {
			loginRedirect = '/';
		}
		return <Navigate to={loginRedirect} />;
	}

	if (auth.error) {
		return <div>Oops... {auth.error.message}</div>;
	}

	return (
		<div className="flex flex-col items-center justify-center w-full h-screen">
			<div className="flex flex-col items-center w-full sm:max-w-md p-6">
				<Logo className="h-48 my-5" />
				<Button
					className="self-stretch"
					onClick={() => void auth.signinRedirect()}
				>
					Přihlásit se
				</Button>
			</div>
		</div>
	);
}
