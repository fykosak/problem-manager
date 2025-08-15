import { Control, FieldPathByValue, FieldValues } from 'react-hook-form';

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@client/components/ui/form';
import { trpcOutputTypes } from '@client/trpc';

import { Checkbox } from '../ui/checkbox';

export function TopicSelection<T extends FieldValues>({
	control,
	topics,
	name,
}: {
	control: Control<T>;
	name: FieldPathByValue<T, number[]>; // require the name to point to a form property of type number[]
	topics: trpcOutputTypes['contest']['availableTopics'];
}) {
	const topicCheckboxes = topics.map((topic) => (
		<FormField
			key={topic.topicId}
			control={control}
			name={name}
			render={({ field }) => {
				const fieldValue = field.value as number[];
				return (
					<FormItem
						key={topic.topicId}
						className="flex flex-row items-start space-x-2 space-y-0"
					>
						<FormControl>
							<Checkbox
								checked={fieldValue.includes(topic.topicId)}
								onCheckedChange={(checked) => {
									return checked
										? field.onChange([
												...field.value,
												topic.topicId,
											])
										: field.onChange(
												fieldValue.filter(
													(value) =>
														value !== topic.topicId
												)
											);
								}}
							/>
						</FormControl>
						<FormLabel className="text-sm font-normal">
							{topic.label}
						</FormLabel>
					</FormItem>
				);
			}}
		/>
	));

	return (
		<FormField
			control={control}
			name={name}
			render={() => (
				<FormItem>
					<FormLabel>Témata</FormLabel>
					<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
						{topicCheckboxes}
					</div>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
