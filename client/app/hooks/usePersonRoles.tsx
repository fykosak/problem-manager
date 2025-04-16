import { useContext } from 'react';

import { PersonRolesContext } from './personRolesProvider';

export function usePersonRoles() {
	const context = useContext(PersonRolesContext);

	if (!context) {
		throw new Error('Person roles should not be null');
	}

	return context;
}
