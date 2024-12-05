import { ColumnDef } from "@tanstack/react-table"
import { ArrowDownUp } from "lucide-react"
import { Button } from "~/components/ui/button"

export type Task = {
	name: string
	author: string
	topic: string[]
	type: string
	state: string
	created: Date
}

export const columns: ColumnDef<Task>[] = [
	{
		accessorKey: "name",
		header: "Název"
	},
	{
		accessorKey: "author",
		header: "Autor"
	},
	{
		accessorKey: "topic",
		header: "Téma"
	},
	{
		accessorKey: "type",
		header: "Typ"
	},
	{
		accessorKey: "state",
		header: "Stav"
	},
	{
		accessorKey: "created",
		cell: ({ row }) => {
			const created: Date = row.getValue("created")
			return created.toLocaleString("cs-CZ")
		},
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Vytvořeno
					<ArrowDownUp className="ml-2 h-4 w-4" />
				</Button>
			)
		},
	},
]
