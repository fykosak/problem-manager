import { NavLink } from "react-router";

export default function NavigationBar() {
	return (
		<nav>
			<NavLink className="px-3 py-2" to="/" end>Home</NavLink>
			<NavLink className="px-3 py-2" to="/tasks" end>Úlohy</NavLink>
			<NavLink className="px-3 py-2" to="/tasks/edit" end>Úprava úlohy</NavLink>
			<NavLink className="px-3 py-2" to="/task-suggestions" end>Návrhy na úlohy</NavLink>
		</nav>
	);
}
