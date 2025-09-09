import { acl } from '@server/acl/aclFactory';

import { ImportOrganizersForm } from '@client/components/forms/importOrganizersForm';
import { usePersonRoles } from '@client/hooks/usePersonRoles';

export default function Admin() {
	const roles = usePersonRoles();
	if (!acl.isAllowedBase(roles, 'organizers', 'import')) {
		throw new Error('You cannot access this page');
	}
	return (
		<div className="max-w-screen-sm mx-auto">
			<h1>Admin panel</h1>
			<ImportOrganizersForm />
		</div>
	);
}
