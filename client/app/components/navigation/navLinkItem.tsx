import { NavLink } from 'react-router';

import { Button } from '../ui/button';

export default function NavLinkItem(props: {
	to: string;
	name: string;
	onClick?: () => void;
}) {
	return (
		<NavLink to={props.to} end>
			{({ isActive }) => (
				<Button
					variant={isActive ? 'default' : 'outline'}
					onClick={props.onClick}
				>
					{props.name}
				</Button>
			)}
		</NavLink>
	);
}
