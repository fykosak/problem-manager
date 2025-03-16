import { Check, Cog } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@client/lib/utils';
import { trpc, trpcOutputTypes } from '@client/trpc';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export default function WorkPersonSelect({
	work,
	organizers,
}: {
	work: trpcOutputTypes['problem']['work'][0];
	organizers: trpcOutputTypes['contest']['organizers'];
}) {
	const [selectedValues, setSelectedValues] = useState(
		new Set<number>(Array.from(work.people, (person) => person.personId))
	);

	async function updateWorkPerson(personId: number, assigned: boolean) {
		await trpc.work.updatePersonWork.query({
			workId: work.workId,
			personId: personId,
			assigned: assigned,
		});
	}

	const personOptions = [];
	for (const organizer of organizers) {
		const person = organizer.person;
		const isSelected = selectedValues.has(person.personId);
		personOptions.push(
			<CommandItem
				key={person.personId}
				// eslint-disable-next-line
				onSelect={async () => {
					if (isSelected) {
						setSelectedValues((prev) => {
							prev.delete(person.personId);
							return new Set(prev);
						});
						await updateWorkPerson(person.personId, false);
					} else {
						setSelectedValues(
							new Set(selectedValues.add(person.personId))
						);
						await updateWorkPerson(person.personId, true);
					}
				}}
			>
				<div
					className={cn(
						'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
						isSelected
							? 'bg-primary text-primary-foreground'
							: 'opacity-50 [&_svg]:invisible'
					)}
				>
					<Check />
				</div>
				<span>
					{person.firstName} {person.lastName} (#{person.personId})
				</span>
			</CommandItem>
		);
	}

	const selectedPeopleBadges = [];
	for (const organizer of organizers) {
		if (selectedValues.has(organizer.personId)) {
			selectedPeopleBadges.push(
				<Badge
					key={organizer.person.personId}
					variant="outline"
					className="h-9"
				>
					{organizer.person.firstName} {organizer.person.lastName}
				</Badge>
			);
		}
	}

	return (
		<div className="flex flex-row flex-wrap items-center gap-2">
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" size="icon">
						<Cog />
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					<Command>
						<CommandInput placeholder="user" />
						<CommandList>
							<CommandEmpty>No user found</CommandEmpty>
							<CommandGroup>{personOptions}</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{selectedPeopleBadges}
		</div>
	);
}
