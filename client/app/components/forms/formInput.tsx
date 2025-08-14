import { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';

export function FormInput<T extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	type = 'text',
}: {
	control: Control<T>;
	name: FieldPath<T>;
	label: string;
	placeholder?: string;
	type?: string;
}) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<Input
							type={type}
							placeholder={placeholder}
							{...field}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
