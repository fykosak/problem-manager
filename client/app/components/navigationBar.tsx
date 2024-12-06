import { useState } from "react";
import { NavLink, NavLinkRenderProps, useLocation } from "react-router";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";

const links = [
	{ name: "Home", link: "/" },
	{ name: "Úlohy", link: "/tasks" },
	{ name: "Úprava úlohy", link: "/tasks/edit" },
	{ name: "Návrhy na úlohy", link: "/task-suggestions" },
]

function NavLinkItem(props: { to: string, name: string }) {
	const location = useLocation();
	const isActive = location.pathname === props.to;
	return <Button variant={isActive ? "default" : "outline"} asChild>
		<NavLink key={props.to} to={props.to} end>{props.name}</NavLink>
	</Button>
}

export default function NavigationBar() {
	const [navHidden, setNavHidden] = useState(true);

	function switchVisible() {
		setNavHidden(!navHidden);
	}

	return <nav className="flex items-center justify-between flex-wrap lg:space-x-2">
		<div>
			Logo
		</div>
		<Button className="lg:hidden" onClick={switchVisible} variant="outline"><Menu /></Button>
		<div className={(navHidden ? "hidden" : "flex") + " flex-col lg:flex lg:flex-row basis-full lg:basis-auto grow justify-between"}>
			<div className={(navHidden ? "hidden" : "flex") + " lg:flex flex-col lg:flex-row w-full lg:w-auto lg:items-center lg:space-x-4 my-2"}>
				{links.map((link) => (
					<NavLinkItem to={link.link} name={link.name} />
				))}
			</div>
			<div className={(navHidden ? "hidden" : "flex") + " lg:flex flex-col lg:flex-row w-full lg:w-auto lg:items-center lg:space-x-4 my-2"}>
				<a>38. ročník</a>
				<a>FYKOS</a>
				<a>Adam Krška</a>
			</div>
		</div>
	</nav >;
}
