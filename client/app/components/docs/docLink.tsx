import { Link } from 'react-router';

import { Button } from '../ui/button';

export function DocLink({
	filename,
	title,
}: {
	filename: string;
	title: string;
}) {
	return (
		<Button variant="ghost" asChild>
			<Link to={'/how-to/' + filename.replace('.md', '')}>{title}</Link>
		</Button>
	);
}
