import config from '@server/config';

import { type User, UserAdapter } from './userAdapter';

export class FKSDBUserAdapter extends UserAdapter {
	async downloadData(contestId: number) {
		const response = await fetch(
			config.fksdbApiUrl + '/contests/' + contestId + '/organizers',
			{
				headers: {
					Authorization:
						'Basic ' +
						Buffer.from(
							config.fksdbLogin + ':' + config.fksdbPassword
						).toString('base64'),
				},
			}
		);
		return (await response.json()) as {
			name: string;
			personId: number;
			since: number;
			until: number | null;
			domainAlias: string;
		}[];
	}

	async getUserData() {
		const fksdbContests = [
			{
				contestId: 1,
				symbol: 'fykos',
				domain: '@fykos.cz',
			},
			{
				contestId: 2,
				symbol: 'vyfuk',
				domain: '@vyfuk.org',
			},
		];

		const people = new Map<number, User>();

		for (const fksdbContest of fksdbContests) {
			try {
				const organizerData = await this.downloadData(
					fksdbContest.contestId
				);

				for (const organizer of organizerData) {
					if (!organizer.domainAlias) {
						continue;
					}

					if (!organizer.personId) {
						throw new Error('Missing PersonId');
					}
					if (!organizer.name) {
						throw new Error('Missing name');
					}

					//if (!organizer.otherName) {
					//	throw new Error('Missing other name');
					//}
					//if (!organizer.familyName) {
					//	throw new Error('Missing family name');
					//}

					// TODO download real data instead of splitting
					const [firstName, lastName] = organizer.name.split(' ');

					let person = people.get(organizer.personId);
					if (!person) {
						person = {
							personId: organizer.personId,
							//firstName: organizer.otherName,
							//lastName: organizer.familyName,
							firstName: firstName,
							lastName: lastName,
							organizers: [],
						};
					}

					person.organizers.push({
						contestSymbol: fksdbContest.symbol,
						email: organizer.domainAlias + fksdbContest.domain,
						since: organizer.since,
						until: organizer.until,
					});

					people.set(organizer.personId, person);
				}
			} catch (error) {
				console.error(error);
			}
		}

		return Array.from(people.values());
	}
}
