import { Check, Cog } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';

import { cn } from '@client/lib/utils';
import { trpcOutputTypes } from '@client/trpc';

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

export default function PersonSelect({
	onChange,
	selected,
	organizers,
}: {
	onChange?: (personId: number, selected: boolean) => Promise<void> | void;
	selected: number[];
	organizers: trpcOutputTypes['contest']['organizers'];
}) {
	const [selectedValues, setSelectedValues] = useState(
		new Set<number>(selected)
	);

	const params = useParams();
	const contestYear = Number(params.year);

	organizers.sort((a, b) => {
		const aSelected = selectedValues.has(a.personId);
		const bSelected = selectedValues.has(b.personId);
		if (aSelected !== bSelected) {
			if (aSelected) {
				return -1;
			}
			return 1;
		}

		const firstNameA = a.person.firstName.toUpperCase(); // ignore upper and lowercase
		const firstNameB = b.person.firstName.toUpperCase(); // ignore upper and lowercase
		if (firstNameA < firstNameB) {
			return -1;
		}
		if (firstNameA > firstNameB) {
			return 1;
		}

		const lastNameA = a.person.lastName.toUpperCase(); // ignore upper and lowercase
		const lastNameB = b.person.lastName.toUpperCase(); // ignore upper and lowercase
		if (lastNameA < lastNameB) {
			return -1;
		}
		if (lastNameA > lastNameB) {
			return 1;
		}

		return a.personId - b.personId;
	});

	const personOptions = [];
	for (const organizer of organizers) {
		const person = organizer.person;
		const isSelected = selectedValues.has(person.personId);
		if (
			contestYear &&
			(organizer.since > contestYear ||
				(organizer.until !== null && organizer.until < contestYear)) &&
			!isSelected
		) {
			continue;
		}
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
						if (onChange) {
							await onChange(person.personId, false);
						}
					} else {
						setSelectedValues(
							new Set(selectedValues.add(person.personId))
						);
						if (onChange) {
							await onChange(person.personId, true);
						}
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
