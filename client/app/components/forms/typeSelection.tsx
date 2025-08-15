import { Control, FieldPathByValue, FieldValues } from 'react-hook-form';

import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@client/components/ui/form';
import { trpcOutputTypes } from '@client/trpc';

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';

export function TypeSelection<T extends FieldValues>({
	control,
	name,
	availableTypes,
}: {
	control: Control<T>;
	name: FieldPathByValue<T, number>;
	availableTypes: trpcOutputTypes['contest']['availableTypes'];
}) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="space-x-2">
					<FormLabel>Typ úlohy</FormLabel>
					<Select
						onValueChange={field.onChange}
						// select value placeholder if field.value undefined
						value={
							field.value
								? (field.value as number).toString()
								: ''
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Vybrat typ" />
						</SelectTrigger>
						<SelectContent>
							{availableTypes.map((type) => (
								<SelectItem
									value={type.typeId.toString()}
									key={type.typeId}
								>
									{type.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
