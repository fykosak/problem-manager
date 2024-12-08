import { Button } from "~/components/ui/button";
import type { Route } from "./+types/home";
import { trpc } from "~/trpc";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export async function clientLoader({}: Route.ClientActionArgs) {
	//	const user = await trpc.getUser.query('2');
	//	console.log(user);
	await new Promise(r => setTimeout(r, 2000));
}

export default function Home() {
	return <p>
		home page
		<Button>Click</Button>
	</p>;
}
