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
					variant={'ghost'}
					onClick={props.onClick}
					className={
						isActive
							? 'border-b-2 border-primary rounded-b-none'
							: ''
					}
				>
					{isPending && <Loader />}
					{props.name}
				</Button>
			)}
		</NavLink>
	);
}
