import { ACL } from './acl';
import { BaseRole, ContestRole } from './roleTypes';

export const acl = new ACL();

// base roles
acl.addRole(BaseRole.admin);

// allow everything
acl.allow(BaseRole.admin);

// contest
acl.addRole(ContestRole.organizer);
acl.addRole(ContestRole.manager, ContestRole.organizer);

acl.allow(ContestRole.organizer, 'problem');
acl.allow(ContestRole.organizer, 'contest');
acl.allow(ContestRole.manager, 'series');
