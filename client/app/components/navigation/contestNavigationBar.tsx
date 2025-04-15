import { ArrowDown } from 'lucide-react';
import { generatePath } from 'react-router';

import useCurrentRoute from '@client/hooks/useCurrentRoute';
import { cn } from '@client/lib/utils';

import { buttonVariants } from '../ui/button';
import { ContestIcon } from '../ui/contestIcon';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import DropdownLinkItem from './dropdownLinkItem';
import NavigationBar from './navigationBar';

const links = [
	{ name: 'Úlohy', link: '' },
	{ name: 'Návrhy na úlohy', link: 'tasks/suggestions' },
];

export default function ContestNavigationBar({
	contests,
	selectedContest,
	selectedYear,
}: {
	contests: {
		contestId: number;
		name: string;
		symbol: string;
		years: {
			contestYearId: number;
			contestId: number;
			year: number;
		}[];
	}[];
	selectedContest: {
		contestId: number;
		name: string;
		symbol: string;
		years: {
			contestYearId: number;
			contestId: number;
			year: number;
		}[];
	};
	selectedYear: {
		contestYearId: number;
		contestId: number;
		year: number;
	};
}) {
	const currentRoute = useCurrentRoute();
	if (!currentRoute) {
		throw new Error('No route matched');
	}

	const contestItems = contests.map((contest) => {
		const contestYear = contest.years.at(0)?.year;
		const path = generatePath('/' + currentRoute.route.path, {
			...currentRoute.params,
			contest: contest.symbol,
			year: contestYear,
		});
		return (
			<DropdownLinkItem key={contest.contestId} to={path}>
				<ContestIcon contestSymbol={contest.symbol} /> {contest.name}
			</DropdownLinkItem>
		);
	});
	const yearItems = selectedContest.years.map((year) => {
		const path = generatePath('/' + currentRoute.route.path, {
			...currentRoute.params,
			year: year.year,
		});
		return (
			<DropdownLinkItem key={year.year} to={path}>
				{year.year + '. ročník'}
			</DropdownLinkItem>
		);
	});

	return (
		<NavigationBar links={links}>
			<DropdownMenu>
				<DropdownMenuTrigger>
					<div className={cn(buttonVariants({ variant: 'ghost' }))}>
						{selectedYear.year}. ročník <ArrowDown />
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent>{yearItems}</DropdownMenuContent>
			</DropdownMenu>

			<DropdownMenu>
				<DropdownMenuTrigger>
					<div className={cn(buttonVariants({ variant: 'ghost' }))}>
						<ContestIcon contestSymbol={selectedContest.symbol} />
						{selectedContest.name} <ArrowDown />
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent>{contestItems}</DropdownMenuContent>
			</DropdownMenu>
		</NavigationBar>
	);
}
