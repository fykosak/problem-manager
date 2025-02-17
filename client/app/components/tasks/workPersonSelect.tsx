import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Check, Cog } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { trpc, trpcOutputTypes } from "~/trpc";
import { Badge } from "../ui/badge";

export default function WorkPersonSelect({ work, people }: {
	work: trpcOutputTypes['problem']['work'][0],
	people: trpcOutputTypes['contest']['people']
}) {
	const [selectedValues, setSelectedValues] = useState(new Set<number>(Array.from(work.people, (person) => person.personId)));

	async function updateWorkPerson(personId: number, assigned: boolean) {
		await trpc.work.updatePersonWork.query({ workId: work.workId, personId: personId, assigned: assigned });
	}

	let personOptions = [];
	for (let person of people) {
		const isSelected = selectedValues.has(person.personId);
		personOptions.push(
			<CommandItem
				key={person.personId}
				onSelect={() => {
					if (isSelected) {
						setSelectedValues(prev => {
							prev.delete(person.personId);
							return new Set(prev);
						});
						updateWorkPerson(person.personId, false);
					} else {
						setSelectedValues(new Set(selectedValues.add(person.personId)));
						updateWorkPerson(person.personId, true);
					}
				}}>
				<div
					className={cn(
						"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
						isSelected
							? "bg-primary text-primary-foreground"
							: "opacity-50 [&_svg]:invisible"
					)}
				>
					<Check />
				</div>
				<span>{person.firstName} {person.lastName} (#{person.personId})</span>
			</CommandItem>
		)
	}

	let selectedPeopleBadges = [];
	for (let person of people) {
		if (selectedValues.has(person.personId)) {
			selectedPeopleBadges.push(
				<Badge key={person.personId} variant='outline' className="h-9">{person.firstName} {person.lastName}</Badge>
			)
		}
	}


	return (
		<div className="flex flex-row flex-wrap items-center gap-2">
			<Popover>
				<PopoverTrigger asChild>
					<Button variant='outline' size='icon'>
						<Cog />
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					<Command>
						<CommandInput placeholder="user" />
						<CommandList>
							<CommandEmpty>No user found</CommandEmpty>
							<CommandGroup>
								{personOptions}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{selectedPeopleBadges}
		</div>
	)
}
