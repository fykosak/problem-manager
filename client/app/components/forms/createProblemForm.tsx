import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import { langEnum } from '@server/db/schema';

import { usePersonRoles } from '@client/hooks/usePersonRoles';
import { trpc, type trpcOutputTypes } from '@client/trpc';

import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
	contestSymbol: z.string(),
	lang: z.enum(langEnum.enumValues),
	name: z.string().nonempty('Název nemůže být prázdný'),
	origin: z.string().optional(),
	task: z.string().nonempty('Text zádání nemůže být prázdný'),
	topics: z.number().array().min(1, 'Alespoň jeden topic musí být přidělen'),
	type: z.coerce.number({ message: 'Potřeba vybrat typ úlohy' }),
});

export function CreateProblemForm({
	currentContestSymbol,
	contestData,
}: {
	currentContestSymbol?: string;
	contestData: trpcOutputTypes['contest']['createProblemData'];
}) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			contestSymbol: currentContestSymbol,
			lang: 'cs', // TODO from config?
			name: '',
			origin: '',
			task: '',
			topics: [],
		},
	});

	const navigate = useNavigate();
	async function submitAndRedirect(values: z.infer<typeof formSchema>) {
		try {
			const problem = await trpc.problem.create.mutate({
				...values,
			});
			toast.success('Task created');
			await navigate('../task/' + problem.problemId);
		} catch (exception) {
			form.setError('root', {
				message: (exception as Error).message ?? 'Error',
				type: 'server',
			});
		}
	}

	async function submitAndContinue(values: z.infer<typeof formSchema>) {
		try {
			await trpc.problem.create.mutate({
				...values,
			});
			toast.success('Task created');
			form.reset();
		} catch (exception) {
			form.setError('root', {
				message: (exception as Error).message ?? 'Error',
				type: 'server',
			});
			toast.error('Failed to create task');
		}
	}

	const { formState, resetField, watch } = form;
	const { errors } = formState;

	const contestSymbol = watch('contestSymbol');
	useEffect(() => {
		resetField('type');
	}, [contestSymbol]);

	const personRoles = usePersonRoles();
	const contests = contestData.contests.filter((contest) =>
		acl.isAllowedContest(personRoles, contest.symbol, 'problem', 'create')
	);
	const selectedContest = contests.find(
		(contest) => contest.symbol === contestSymbol
	);
	const langs = contestData.contestTextLangs[contestSymbol] ?? [];

	function langLabel(lang: string) {
		if (lang === 'cs') {
			return 'Čeština';
		}
		if (lang === 'en') {
			return 'Angličtina';
		}
		return lang;
	}

	function getTopicsCheckboxes() {
		const selectableTopics = selectedContest ? selectedContest.topics : [];
		return selectableTopics.map((topic) => (
			<FormField
				key={topic.topicId}
				control={form.control}
				name="topics"
				render={({ field }) => (
					<FormItem
						key={topic.topicId}
						className="flex flex-row items-start space-x-2 space-y-0"
					>
						<FormControl>
							<Checkbox
								checked={field.value?.includes(topic.topicId)}
								onCheckedChange={(checked) => {
									return checked
										? field.onChange([
												...field.value,
												topic.topicId,
											])
										: field.onChange(
												field.value?.filter(
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
				)}
			/>
		));
	}

	const contestSelectComponent = (
		<FormField
			control={form.control}
			name="contestSymbol"
			render={({ field }) => (
				<FormItem className="space-x-2">
					<FormLabel>Soutěž</FormLabel>
					<Select
						onValueChange={field.onChange}
						value={field.value ? field.value : ''}
					>
						<SelectTrigger>
							<SelectValue placeholder="Vyber soutěž" />
						</SelectTrigger>
						<SelectContent>
							{contests.map((contest) => (
								<SelectItem
									value={contest.symbol}
									key={contest.symbol}
								>
									{contest.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	if (!contestSymbol) {
		return (
			<Form {...form}>
				<div>{errors.root?.message}</div>
				<form className="space-y-8">{contestSelectComponent}</form>
			</Form>
		);
	}

	return (
		<Form {...form}>
			<div>{errors.root?.message}</div>
			<form className="space-y-8">
				{contestSelectComponent}

				<FormField
					control={form.control}
					name="lang"
					render={({ field }) => (
						<FormItem className="space-x-2">
							<FormLabel>Jazyk návrhu</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={
									field.value ? field.value.toString() : ''
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select lang" />
								</SelectTrigger>
								<SelectContent>
									{langs.map((lang) => (
										<SelectItem key={lang} value={lang}>
											{langLabel(lang)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Název</FormLabel>
							<FormControl>
								<Input placeholder="Název" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="origin"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Původ úlohy</FormLabel>
							<FormControl>
								<Input
									placeholder="Krátká věta o původu/vzniku úlohy"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="task"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Zadání</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Text zadání"
									size="lg"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="topics"
					render={() => (
						<FormItem>
							<FormLabel>Témata</FormLabel>
							<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
								{getTopicsCheckboxes()}
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem className="space-x-2">
							<FormLabel>Typ úlohy</FormLabel>
							<Select
								onValueChange={field.onChange}
								// select value placeholder if field.value undefined
								value={
									field.value ? field.value.toString() : ''
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									{selectedContest?.types.map((type) => (
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
			</form>

			<div className="space-y-2 space-x-2 my-2">
				<Button
					// eslint-disable-next-line
					onClick={form.handleSubmit(submitAndContinue)}
					disabled={form.formState.isSubmitting}
				>
					Uložit a navrhnout další
				</Button>
				<Button
					// eslint-disable-next-line
					onClick={form.handleSubmit(submitAndRedirect)}
					disabled={formState.isSubmitting}
				>
					Uložit a pokračovat v editaci
				</Button>
			</div>
		</Form>
	);
}
