import { NavLink, NavLinkRenderProps } from "react-router";

const links = [
	{ name: "Home", link: "/" },
	{ name: "Úlohy", link: "/tasks" },
	{ name: "Úprava úlohy", link: "/tasks/edit" },
	{ name: "Návrhy na úlohy", link: "/task-suggestions" },
]

function getNavLinkClass(props: NavLinkRenderProps): string {
	let className = "border border-2 h-9 px-4 py-2 rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
	if (props.isActive) {
		className += " bg-primary text-primary-foreground hover:bg-primary/90"
	} else {
		className += " bg-background hover:bg-accent hover:text-accent-foreground"
	}
	return className;
}

export default function NavigationBar() {
	return <nav className="flex items-center justify-between">
		<div className="space-x-4 my-2">
			{links.map((link) => (
				<NavLink className={getNavLinkClass} to={link.link} end>{link.name}</NavLink>
			))}
		</div>
	</nav >;
}
