import { Braces, LetterText, ListTodo, Paperclip, Pen } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { Link } from 'react-router';

import { Layout, getLayoutLabel } from '@client/components/editor/layoutEnum';
import NavigationSuspense from '@client/components/navigation/navigationSuspense';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@client/components/ui/breadcrumb';
import { Loader } from '@client/components/ui/loader';
import { ProgressWork } from '@client/components/ui/progressWork';
import {
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@client/components/ui/select';
import { Select } from '@client/components/ui/select';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from '@client/components/ui/sidebar';
import {
	EditorLayoutProvider,
	useEditorLayout,
} from '@client/hooks/editorLayoutProvider';
import useCurrentRoute from '@client/hooks/useCurrentRoute';
import { trpc, type trpcOutputTypes } from '@client/trpc';

import { Route } from './+types/task.layout';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const problemId = Number(params.taskId);
	if (isNaN(problemId) || !isFinite(problemId)) {
		throw new Error('Invalid task id');
	}

	const problem = await trpc.problem.info.query(problemId);

	const texts = await trpc.problem.texts.query({
		problemId: problemId,
	});

	const textsById = new Map<number, trpcOutputTypes['problem']['texts'][0]>();
	const textsByType = new Map<string, trpcOutputTypes['problem']['texts']>();

	for (const text of texts) {
		textsById.set(text.textId, text);

		const textsOfSameType = textsByType.get(text.type) ?? [];
		textsOfSameType.push(text);
		textsByType.set(text.type, textsOfSameType);
	}

	const problemWork = await trpc.problem.work.query(problemId);
	const workStats = new Map<string, number>();
	for (const work of problemWork) {
		const currentCount = workStats.get(work.state) ?? 0;
		workStats.set(work.state, currentCount + 1);
	}

	return { problem, textsById, textsByType, workStats };
}

function SiderbarNavlink({
	to,
	label,
	icon,
	workStats,
}: {
	to: string;
	label: string;
	icon?: React.ReactNode;
	workStats?: Map<string, number>;
}) {
	return (
		<SidebarMenuItem>
			<NavLink to={to} end>
				{({ isActive, isPending }) => (
					<>
						<SidebarMenuButton isActive={isActive}>
							{isPending ? <Loader /> : icon} {label}
						</SidebarMenuButton>
						{workStats && <ProgressWork workStats={workStats} />}
					</>
				)}
			</NavLink>
		</SidebarMenuItem>
	);
}

function ProblemSidebar({
	problem,
	workStats,
}: {
	problem: trpcOutputTypes['problem']['info'];
	workStats: Map<string, number>;
}) {
	const { desktopLayout, setDesktopLayout } = useEditorLayout();
	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="flex flex-col items-start h-auto mb-2">
						<span>
							{
								(
									problem.metadata.name as Record<
										string,
										string
									>
								).cs
							}
						</span>
						{problem.series && (
							<span>
								série {problem.series.label}, ročník{' '}
								{problem.series.contestYear.year}
							</span>
						)}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SiderbarNavlink
								to={''}
								label={'Editor textů'}
								icon={<Pen />}
							/>
							<SiderbarNavlink
								to={'metadata'}
								label={'Info o úloze'}
								icon={<Braces />}
							/>
							<SiderbarNavlink
								to={'work'}
								label={'Korektury a úkoly'}
								icon={<ListTodo />}
								workStats={workStats}
							/>
							<SiderbarNavlink
								to={'files'}
								label={'Soubory'}
								icon={<Paperclip />}
							/>
							<SiderbarNavlink
								to={'web-texts'}
								label={'Zveřejnění textů'}
								icon={<LetterText />}
							/>
						</SidebarMenu>
					</SidebarGroupContent>
					<SidebarGroup>
						<SidebarGroupLabel>Rozložení</SidebarGroupLabel>
						<SidebarGroupContent>
							<Select
								onValueChange={(value) =>
									setDesktopLayout(value as Layout)
								}
								defaultValue={desktopLayout}
							>
								<SelectTrigger size="sm">
									<SelectValue placeholder="Vybrat rozložení" />
								</SelectTrigger>
								<SelectContent>
									{Object.values(Layout).map((layout) => (
										<SelectItem value={layout} key={layout}>
											{getLayoutLabel(layout)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}

function TaskBreadcrumb({
	problem,
}: {
	problem: trpcOutputTypes['problem']['info'];
}) {
	const route = useCurrentRoute();
	const place = route?.pathname.split('/').at(-1);
	let label = 'Editor textů';
	switch (place) {
		case 'metadata':
			label = 'Info o úloze';
			break;
		case 'work':
			label = 'Korektury a úkoly';
			break;
		case 'files':
			label = 'Soubory';
			break;
		case 'web-texts':
			label = 'Zveřejnění textů';
			break;
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					{problem.series ? (
						<BreadcrumbLink asChild>
							<Link to="..">Úlohy</Link>
						</BreadcrumbLink>
					) : (
						<BreadcrumbLink asChild>
							<Link to="../tasks/suggestions">
								Návrhy na úlohy
							</Link>
						</BreadcrumbLink>
					)}
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					{(problem.metadata.name as Record<string, string>).cs}
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>{label}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}

export default function Task({ loaderData }: Route.ComponentProps) {
	return (
		<EditorLayoutProvider textData={loaderData}>
			<div className="w-full bg-sidebar">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-2">
					<TaskBreadcrumb problem={loaderData.problem} />
				</div>
			</div>
			<SidebarProvider className="flex-1">
				<ProblemSidebar
					problem={loaderData.problem}
					workStats={loaderData.workStats}
				/>
				<main className="w-full">
					<SidebarTrigger className="absolute top-0 left-0" />
					<NavigationSuspense>
						<Outlet />
					</NavigationSuspense>
				</main>
			</SidebarProvider>
		</EditorLayoutProvider>
	);
}
