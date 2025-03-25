import { createContext } from 'react';

import { PersonRoles } from '@server/acl/roleTypes';

import { trpcOutputTypes } from '@client/trpc';

export const PersonRolesContext = createContext<PersonRoles | null>(null);

export function PersonRolesProvider({
	children,
	value,
	...props
}: {
	children: React.ReactNode;
	value: trpcOutputTypes['person']['roles'];
}) {
	const personRoles = {
		baseRole: new Set(value.baseRole),
		contestRole: new Map<string, Set<string>>(),
	};

	for (const contest in value.contestRole) {
		personRoles.contestRole.set(
			contest,
			new Set(value.contestRole[contest])
		);
	}

	return (
		<PersonRolesContext.Provider {...props} value={personRoles}>
			{children}
		</PersonRolesContext.Provider>
	);
}
