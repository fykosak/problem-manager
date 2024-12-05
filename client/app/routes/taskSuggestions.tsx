import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/dataTable";
import { Task, columns } from "~/models/task/columns";

let data: Task[] = [];

for (let i = 0; i < 333; i++) {
	data.push({
		"name": "Skáčeme z vlaku",
		"author": "Adam Krška",
		"topic": [
			"kinematika",
			"dynamika"
		],
		"type": "Složité",
		"state": "Nevybrané",
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
		"state": "Nevybrané",
		"created": new Date("2024-12-02 13:01:01")
	})
}

export default function TaskSuggestions() {
	return <>
		<div>
			<Button>+ Navrhnout úlohu</Button>
		</div>
		<div>
			<h2>Typ úlohy</h2>
			<Button className="mr-2">Jednoduché</Button>
			<Button className="mr-2">Složité</Button>
			<Button className="mr-2">Experiment</Button>
			<Button className="mr-2">Problémovka</Button>
		</div>
		<div>
			<h2>Stav úlohy</h2>
			<Button className="mr-2">Nevybrané</Button>
			<Button className="mr-2">Vybrané</Button>
			<Button className="mr-2">Koš</Button>
		</div>
		<DataTable columns={columns} data={data} />
	</>;
}
