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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { FormInput } from './formInput';
import { TopicSelection } from './topicSelection';

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
				<FormInput
					control={form.control}
					name="name"
					placeholder="Název úlohy"
					label="Název"
				/>
				<FormInput
					control={form.control}
					name="origin"
					placeholder="Krátká věta o původu/vzniku úlohy"
					label="Původ úlohy"
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

				<TopicSelection
					control={form.control}
					name="topics"
					topics={selectedContest ? selectedContest.topics : []}
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
									<SelectValue placeholder="Vybrat typ" />
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
					Uložit a otevřít v editoru
				</Button>
			</div>
		</Form>
	);
}
