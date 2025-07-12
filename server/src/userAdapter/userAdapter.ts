import type { organizerStateEnum } from '@server/db/schema';

export interface User {
	personId: number;
	firstName: string;
	lastName: string;
	organizers: {
		contestSymbol: string;
		email: string;
		state: (typeof organizerStateEnum.enumValues)[number];
	}[];
}

export abstract class UserAdapter {
	abstract getUserData(): Promise<User[]>;
}
