import { trpcOutputTypes } from '@client/trpc';
import { createContext } from 'react';

export const PersonRolesContext = createContext<
	trpcOutputTypes['person']['roles'] | null
>(null);

export function PersonRolesProvider({
	children,
	value,
	...props
}: {
	children: React.ReactNode;
	value: trpcOutputTypes['person']['roles'];
}) {
	return (
		<PersonRolesContext.Provider {...props} value={value}>
			{children}
		</PersonRolesContext.Provider>
	);
}
