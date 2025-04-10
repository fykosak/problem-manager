import { NavLink } from 'react-router';

import { Button } from '../ui/button';
import { Loader } from '../ui/loader';

export default function NavLinkItem(props: {
	to: string;
	name: string;
	onClick?: () => void;
}) {
	return (
		<NavLink to={props.to} end>
			{({ isActive, isPending }) => (
				<Button
					variant={isActive ? 'default' : 'outline'}
					onClick={props.onClick}
				>
					{isPending && <Loader />}
					{props.name}
				</Button>
			)}
		</NavLink>
	);
}
