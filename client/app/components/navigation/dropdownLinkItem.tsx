import { DropdownMenuItem } from '@client/components/ui/dropdown-menu';
import { NavLink } from 'react-router';

export default function DropdownLinkItem(props: { to: string; name: string }) {
	return (
		<DropdownMenuItem asChild>
			<NavLink to={props.to}>{props.name}</NavLink>
		</DropdownMenuItem>
	);
}
