import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/dataTable";
import { Task, columns } from "~/models/task/columns";

let data: Task[] = [];

for (let i = 0; i < 5; i++) {
	data.push({
		"name": "Skáčeme z vlaku",
		"author": "Adam Krška",
		"topic": [
			"kinematika",
			"dynamika"
		],
		"type": "Složité",
		"state": "Koš",
		"created": new Date("2024-11-01 12:01:01")
	})

	data.push({
		"name": "Skáčeme na vlak",
		"author": "Adam Krška",
		"topic": [
			"kinematika",
			"dynamika"
		],
		"type": "Jednoduché",
		"state": "Nevybrané",
		"created": new Date("2024-11-01 13:01:01")
	})

	data.push({
		"name": "Topíme vlak",
		"author": "Adam Krška",
		"topic": [
			"hydromechanika"
		],
		"type": "Experiment",
		"state": "Vybrané",
		"created": new Date("2024-12-02 13:01:01")
	})

	data.push({
		"name": "Vlak a letadlo",
		"author": "Adam Krška",
		"topic": [
			"aerodynamika"
		],
		"type": "Složité",
		"state": "Nevybrané",
		"created": new Date("2024-12-02 13:01:01")
	})
}

export default function TaskSuggestions() {

	return <>
		<div className="py-5">
			<Button>+ Navrhnout úlohu</Button>
		</div>
		<DataTable columns={columns} data={data} />
	</>;
}
