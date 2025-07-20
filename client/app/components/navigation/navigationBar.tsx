import { FileQuestion, Menu, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { NavLink } from 'react-router';

import { Button } from '@client/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@client/components/ui/dropdown-menu';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@client/components/ui/tooltip';
import { useTheme } from '@client/hooks/themeProvider';

import Logo from '../ui/logo';
import NavLinkItem from './navLinkItem';

export default function NavigationBar({
	links,
	children,
}: {
	links: {
		name: string;
		link: string;
	}[];
	children?: React.ReactNode;
}) {
	const [navHidden, setNavHidden] = useState(true);
	const { setTheme } = useTheme();
	const auth = useAuth();

	function switchVisible() {
		setNavHidden(!navHidden);
	}

	return (
		<div className="w-full bg-sidebar">
			<div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8 m-auto h-full">
				<nav className="flex items-center justify-between flex-wrap lg:space-x-2 h-full">
					<NavLink to="/">
						<Logo className="h-[2.5rem] me-2" />
					</NavLink>
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
								' lg:flex flex-col lg:flex-row w-full lg:w-auto lg:items-center lg:gap-2'
							}
						>
							{links.map((link) => (
								<NavLinkItem
									onClick={() => setNavHidden(true)}
									key={link.link}
									to={link.link}
									name={link.name}
								/>
							))}
						</div>
						<div
							className={
								(navHidden ? 'hidden' : 'flex') +
								' lg:flex flex-col lg:flex-row w-full lg:w-auto lg:items-center lg:gap-2'
							}
						>
							{children}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost">
										{auth.user?.profile.name}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem asChild>
										<NavLink to="/user/api-keys">
											Api keys
										</NavLink>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => void auth.removeUser()}
									>
										Log out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon">
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
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											asChild
										>
											<NavLink to="/how-to">
												<FileQuestion />
											</NavLink>
										</Button>
									</TooltipTrigger>
									<TooltipContent>Návody</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</div>
				</nav>
			</div>
		</div>
	);
}
