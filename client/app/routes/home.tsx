import { Button } from "~/components/ui/button";
import type { Route } from "./+types/home";
import { trpc } from "~/trpc";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export default function Home() {
	return <p>
		home page
		<Button>Click</Button>
	</p>;
}
