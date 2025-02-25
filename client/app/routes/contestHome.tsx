import { Button } from '~/components/ui/button';

export function meta() {
	return [
		{ title: 'New React Router App' },
		{ name: 'description', content: 'Welcome to React Router!' },
	];
}

export default function Home() {
	return (
		<p>
			home page
			<Button>Click</Button>
		</p>
	);
}
