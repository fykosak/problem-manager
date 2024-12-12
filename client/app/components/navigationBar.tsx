import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { ArrowDown, Menu, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { useTheme } from "./themeProvider";

const links = [
	{ name: "Home", link: "/" },
	{ name: "Úlohy", link: "/tasks" },
	{ name: "Úprava úlohy", link: "/tasks/edit" },
	{ name: "Návrhy na úlohy", link: "/task-suggestions" },
]

export default function NavigationBar() {
	const [navHidden, setNavHidden] = useState(true);
	const { setTheme } = useTheme()

	function switchVisible() {
		setNavHidden(!navHidden);
	}

	function NavLinkItem(props: { to: string, name: string }) {
		const location = useLocation();
		const isActive = location.pathname === props.to;
		return <Button variant={isActive ? "default" : "outline"} asChild onClick={() => setNavHidden(true)}>
			<NavLink to={props.to} end>{props.name}</NavLink>
		</Button>
	}

	// TODO fetch data
	return <nav className="flex items-center justify-between flex-wrap lg:space-x-2">
		<div>
			Logo
		</div>
		<Button className="lg:hidden" onClick={switchVisible} variant="outline"><Menu /></Button>
		<div className={(navHidden ? "hidden" : "flex") + " flex-col lg:flex lg:flex-row basis-full lg:basis-auto grow justify-between"}>
			<div className={(navHidden ? "hidden" : "flex") + " lg:flex flex-col lg:flex-row w-full lg:w-auto lg:items-center lg:gap-2 my-2"}>
				{links.map((link) => (
					<NavLinkItem key={link.link} to={link.link} name={link.name} />
				))}
			</div>
			<div className={(navHidden ? "hidden" : "flex") + " lg:flex flex-col lg:flex-row w-full lg:w-auto lg:items-center lg:gap-2 my-2"}>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="ghost">38. ročník <ArrowDown /></Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem>37. ročník</DropdownMenuItem>
						<DropdownMenuItem>36. ročník</DropdownMenuItem>
						<DropdownMenuItem>35. ročník</DropdownMenuItem>
						<DropdownMenuItem>34. ročník</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="ghost">FYKOS<ArrowDown /></Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem>Fyziklání</DropdownMenuItem>
						<DropdownMenuItem>Fyziklání Online</DropdownMenuItem>
						<DropdownMenuItem>Výfuk</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<a>Adam Krška</a>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
							<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
							<span className="sr-only">Toggle theme</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setTheme("light")}>
							Light
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme("dark")}>
							Dark
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme("system")}>
							System
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	</nav >;
}
