import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogTitle } from '@radix-ui/react-dialog';
import { Plus } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import WorkComponent from '@client/components/tasks/workComponent';
import { Button } from '@client/components/ui/button';
import { DialogContent, DialogTrigger } from '@client/components/ui/dialog';
import { Loader } from '@client/components/ui/loader';
import { trpc, trpcOutputTypes } from '@client/trpc';

import { Route } from './+types/task.work';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const work = await trpc.problem.work.query(Number(params.taskId));
	const availableWork = await trpc.contest.availableWork.query({
		contestSymbol: params.contest,
	});
	const people = await trpc.contest.organizers.query({
		contestSymbol: params.contest,
	});
	return { work, people, availableWork };
}

const addWorkFormSchema = z.object({
	newWork: z
		.object({
			group: z.string().nonempty(),
			label: z.string().nonempty(),
		})
		.array(),
});

function AddWorkForm({
	availableWork,
	currentWork,
	problemId,
	setOpen,
}: {
	availableWork: trpcOutputTypes['contest']['availableWork'];
	currentWork: trpcOutputTypes['problem']['work'];
	problemId: number;
	setOpen: (open: boolean) => void;
}) {
	const form = useForm<z.infer<typeof addWorkFormSchema>>({
		resolver: zodResolver(addWorkFormSchema),
		defaultValues: {
			newWork: [],
		},
	});

	const [selectedWork, setSelectedWork] = useState(new Set<number>());

	const alreadyAssignedWorkMap = new Map<string | null, Set<string>>();
	for (const work of currentWork) {
		const group = alreadyAssignedWorkMap.get(work.group) ?? new Set();
		group.add(work.label);
		alreadyAssignedWorkMap.set(work.group, group);
	}

	const missingWork: Record<string, { id: number; label: string }[]> = {};
	let missingWorkCount = 0;
	for (const group of availableWork) {
		for (const item of group.items) {
			if (
				alreadyAssignedWorkMap.has(group.groupName) &&
				alreadyAssignedWorkMap.get(group.groupName)?.has(item.name)
			) {
				continue;
			}
			//missingWork.push({ group: group.groupName, label: item.name });
			const groupWork = missingWork[group.groupName] ?? [];
			groupWork.push({ id: missingWorkCount, label: item.name });
			missingWork[group.groupName] = groupWork;
			missingWorkCount++;
		}
	}

	const revalidator = useRevalidator();

	function toggleWorkSelect(id: number) {
		const newSelectedWork = new Set(selectedWork);
		if (newSelectedWork.has(id)) {
			newSelectedWork.delete(id);
		} else {
			newSelectedWork.add(id);
		}
		console.log(newSelectedWork);
		setSelectedWork(newSelectedWork);
	}

	async function onSubmit() {
		const newWork = [];
		for (const [groupName, groupItems] of Object.entries(missingWork)) {
			for (const work of groupItems) {
				if (selectedWork.has(work.id)) {
					newWork.push({
						group: groupName,
						label: work.label,
					});
				}
			}
		}
		form.setValue('newWork', newWork);
		await form.handleSubmit(async (values) => {
			try {
				await trpc.problem.addWork.mutate({
					problemId: problemId,
					newWork: values.newWork,
				});
				setOpen(false);
				toast.success('Korektury přidány');
				await revalidator.revalidate();
			} catch (exception) {
				form.setError('root', {
					message: (exception as Error).message ?? 'Error',
					type: 'server',
				});
			}
		})();
	}

	return (
		<div className="flex flex-col max-h-[75vh]">
			<div className="flex flex-col gap-2 overflow-y-auto">
				{Object.entries(missingWork).map(([groupName, groupItems]) => (
					<>
						<h3 key={groupName}>{groupName}</h3>
						{groupItems.map((work) => (
							<Button
								key={work.id}
								onClick={() => toggleWorkSelect(work.id)}
								variant={
									selectedWork.has(work.id)
										? 'default'
										: 'outline'
								}
							>
								{work.label}
							</Button>
						))}
					</>
				))}
			</div>
			{!form.formState.isSubmitting ? (
				<Button
					className="flex-none mt-5"
					disabled={selectedWork.size === 0}
					onClick={() => void onSubmit()}
				>
					Přidat {selectedWork.size}{' '}
					{selectedWork.size === 1
						? 'korekturu'
						: selectedWork.size > 1 && selectedWork.size < 5
							? 'korektury'
							: 'korektur'}
				</Button>
			) : (
				<Button className="flex-none mt-5" disabled>
					<Loader /> Přidávání korektur
				</Button>
			)}
		</div>
	);
}

export default function Work({ loaderData, params }: Route.ComponentProps) {
	const groups = new Map<string | null, ReactElement[]>();
	for (const work of loaderData.work) {
		if (!groups.has(work.group)) {
			groups.set(work.group, []);
		}

		groups.get(work.group)?.push(
			<div key={work.workId}>
				<WorkComponent work={work} organizers={loaderData.people} />
			</div>
		);
	}

	const groupElements = [];
	for (const [key, elements] of groups.entries()) {
		groupElements.push(
			<div key={key} className="flex flex-col gap-2">
				<h3>{key}</h3>
				{elements}
			</div>
		);
	}

	const [open, setOpen] = useState(false);

	return (
		<div className="flex flex-row justify-center px-4 sm:px-6 lg:px-8">
			<div>
				<h1>Korektury a úkoly</h1>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus />
							Přidat korekturu
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogTitle className="inline-flex items-center gap-2">
							<Plus /> Přidat korekturu
						</DialogTitle>
						<AddWorkForm
							availableWork={loaderData.availableWork}
							currentWork={loaderData.work}
							problemId={Number(params.taskId)}
							setOpen={setOpen}
						/>
					</DialogContent>
				</Dialog>
				<div className="flex flex-col lg:flex-row gap-12 flex-wrap my-4">
					{groupElements}
				</div>
			</div>
		</div>
	);
}
