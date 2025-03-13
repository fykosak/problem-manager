export enum BaseRole {
	admin = 'admin',
}

export enum ContestRole {
	organizer = 'contest.organizer',
	manager = 'contest.manager',
}

export type RoleMapping = Map<string, Set<string>>;

export interface PersonRoles {
	baseRole: Set<string>;
	contestRole: Map<string, Set<string>>;
}
