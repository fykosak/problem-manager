export interface User {
	personId: number;
	firstName: string;
	lastName: string;
	organizers: {
		contestSymbol: string;
		email: string;
		since: number;
		until: number | null;
	}[];
}

export abstract class UserAdapter {
	abstract getUserData(): Promise<User[]>;
}
