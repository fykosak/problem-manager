import { NavLink } from 'react-router';

import { DropdownMenuItem } from '@client/components/ui/dropdown-menu';

export default function DropdownLinkItem(props: {
	to: string;
	children: React.ReactNode;
}) {
	return (
		<DropdownMenuItem asChild>
			<NavLink to={props.to}>{props.children}</NavLink>
		</DropdownMenuItem>
	);
}
