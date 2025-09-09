import { Control, FieldPathByValue, FieldValues } from 'react-hook-form';

import { trpcOutputTypes } from '@client/trpc';

import PersonSelect from '../tasks/personSelect';
import { FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

export function AuthorSelection<T extends FieldValues>({
	control,
	name,
	label,
	organizers,
}: {
	control: Control<T>;
	name: FieldPathByValue<T, number[]>; // require the name to point to a form property of type number[]
	label: string;
	organizers: trpcOutputTypes['contest']['organizers'];
}) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<PersonSelect
						organizers={organizers}
						selected={field.value}
						onChange={(personId, selected) => {
							if (selected) {
								field.onChange([...field.value, personId]);
							} else {
								field.onChange(
									(field.value as number[]).filter(
										(value) => value != personId
									)
								);
							}
						}}
					/>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
