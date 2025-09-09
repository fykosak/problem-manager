import config from '@server/config/config';
import type { organizerStateEnum } from '@server/db/schema';

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
			personId: number;
			otherName: string;
			familyName: string;
			domainAlias: string | null;
			state: (typeof organizerStateEnum.enumValues)[number];
			texSignature: string | null;
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
					if (!organizer.personId) {
						throw new Error('Missing PersonId');
					}

					if (!organizer.otherName) {
						throw new Error('Missing other name');
					}

					if (!organizer.familyName) {
						throw new Error('Missing family name');
					}

					let person = people.get(organizer.personId);
					if (!person) {
						person = {
							personId: organizer.personId,
							firstName: organizer.otherName,
							lastName: organizer.familyName,
							organizers: [],
						};
					}

					person.organizers.push({
						contestSymbol: fksdbContest.symbol,
						email: organizer.domainAlias
							? organizer.domainAlias + fksdbContest.domain
							: null,
						state: organizer.state,
						texSignature: organizer.texSignature,
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
