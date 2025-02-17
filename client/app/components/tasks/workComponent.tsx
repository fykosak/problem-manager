import { trpc, trpcOutputTypes } from "~/trpc";
import { Card, CardContent, CardHeader } from "../ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select"
import { useState } from "react";
import { workStateEnum } from "~/server/db/schema";
import WorkPersonSelect from "./workPersonSelect";

function getWorkStateLabel(workState: trpcOutputTypes['problem']['work'][0]['state']): string {
	switch (workState) {
		case 'waiting':
			return 'Waiting';
		case 'pending':
			return 'Pending';
		case 'done':
			return 'Done';
	}
}

function getWorkStateColor(workState: trpcOutputTypes['problem']['work'][0]['state']): string {
	switch (workState) {
		case 'waiting':
			return 'bg-neutral-500 text-white';
		case 'pending':
			return 'bg-yellow-500 text-black';
		case 'done':
			return 'bg-green-500 text-black';
	}
}

export default function WorkComponent({ work, people }: { work: trpcOutputTypes['problem']['work'][0], people: trpcOutputTypes['contest']['people'] }) {
	let [state, setState] = useState(work.state);

	function updateState(state) {
		trpc.problem.updateWorkState.query({
			workId: work.workId,
			state: state
		})
	}

	return <Card className="max-w-md">
		<CardHeader className="flex flex-row justify-between gap-2">
			{work.label}
			<Select
				value={state}
				onValueChange={value => {
					updateState(value);
					setState(value);
				}}
			>
				<SelectTrigger className={getWorkStateColor(state)}>
					<SelectValue placeholder="select state" />
				</SelectTrigger>
				<SelectContent>
					{workStateEnum.enumValues.map(state => (
						<SelectItem key={state} value={state}>
							{getWorkStateLabel(state)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</CardHeader>
		<CardContent>
			<WorkPersonSelect work={work} people={people} />
		</CardContent>
	</Card>
}
