import { useState } from 'react';
import { NavLink, generatePath, useLocation } from 'react-router';
import { ArrowDown, Menu, Moon, Sun } from 'lucide-react';
import { Button, buttonVariants } from '~/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useTheme } from '~/components/themeProvider';
import { cn } from '~/lib/utils';
import useCurrentRoute from './useCurrentRoute';
import { useAuth } from 'react-oidc-context';

const links = [
	{ name: 'Home', link: '' },
	{ name: 'Úlohy', link: 'tasks' },
	{ name: 'Návrhy na úlohy', link: 'task-suggestions' },
];

export default function NavigationBar({
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
	const [navHidden, setNavHidden] = useState(true);
	const { setTheme } = useTheme();
	const auth = useAuth();

	function switchVisible() {
		setNavHidden(!navHidden);
	}

	function NavLinkItem(props: { to: string; name: string }) {
		const location = useLocation();
		const isActive = location.pathname === props.to;
		return (
			<Button
				variant={isActive ? 'default' : 'outline'}
				asChild
				onClick={() => setNavHidden(true)}
			>
				<NavLink to={props.to} end>
					{props.name}
				</NavLink>
			</Button>
		);
	}

	function DropdownLinkItem(props: { to: string; name: string }) {
		return (
			<DropdownMenuItem asChild>
				<NavLink to={props.to}>{props.name}</NavLink>
			</DropdownMenuItem>
		);
	}

	const currentRoute = useCurrentRoute();
	if (!currentRoute) {
		throw new Error('No route matched');
	}

	const contestItems = contests.map((contest) => {
		const contestYear = contest.years.at(-1)?.year;
		const path = generatePath('/' + currentRoute.route.path, {
			...currentRoute.params,
			contest: contest.symbol,
			year: contestYear,
		});
		return (
			<DropdownLinkItem
				key={contest.contestId}
				to={path}
				name={contest.name}
			/>
		);
	});
	const yearItems = selectedContest.years.map((year) => {
		const path = generatePath('/' + currentRoute.route.path, {
			...currentRoute.params,
			year: year.year,
		});
		return (
			<DropdownLinkItem
				key={year.year}
				to={path}
				name={year.year + '. ročník'}
			/>
		);
	});

	return (
		<div className="w-full bg-sidebar">
			<div className="2xl:container 2xl:mx-auto px-4 sm:px-6 lg:px-8 m-auto h-full">
				<nav className="flex items-center justify-between flex-wrap lg:space-x-2 h-full">
					<div>Logo</div>
					<Button
						className="lg:hidden"
						onClick={switchVisible}
						variant="outline"
					>
						<Menu />
					</Button>

					<div
						className={
							(navHidden ? 'hidden' : 'flex') +
							' flex-col lg:flex lg:flex-row basis-full lg:basis-auto grow justify-between'
						}
					>
						<div
							className={
								(navHidden ? 'hidden' : 'flex') +
								' lg:flex flex-col lg:flex-row w-full lg:w-auto lg:items-center lg:gap-2 my-2'
							}
						>
							{links.map((link) => (
								<NavLinkItem
									key={link.link}
									to={link.link}
									name={link.name}
								/>
							))}
						</div>
						<div
							className={
								(navHidden ? 'hidden' : 'flex') +
								' lg:flex flex-col lg:flex-row w-full lg:w-auto lg:items-center lg:gap-2 my-2'
							}
						>
							<DropdownMenu>
								<DropdownMenuTrigger>
									<div
										className={cn(
											buttonVariants({ variant: 'ghost' })
										)}
									>
										{selectedYear.year}. ročník{' '}
										<ArrowDown />
									</div>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{yearItems}
								</DropdownMenuContent>
							</DropdownMenu>

							<DropdownMenu>
								<DropdownMenuTrigger>
									<div
										className={cn(
											buttonVariants({ variant: 'ghost' })
										)}
									>
										{selectedContest.name} <ArrowDown />
									</div>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{contestItems}
								</DropdownMenuContent>
							</DropdownMenu>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline">
										Adam Krška
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem
										onClick={() => void auth.removeUser()}
									>
										Log out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="icon">
										<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
										<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
										<span className="sr-only">
											Toggle theme
										</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() => setTheme('light')}
									>
										Light
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setTheme('dark')}
									>
										Dark
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setTheme('system')}
									>
										System
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</nav>
			</div>
		</div>
	);
}
