import { Button } from '@client/components/ui/button';

export function meta() {
	return [{ title: 'Problem manager' }];
}

export default function Home() {
	return (
		<p>
			home page
			<Button>Click</Button>
		</p>
	);
}
