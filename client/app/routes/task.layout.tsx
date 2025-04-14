import { NavLink, Outlet } from 'react-router';

import { Layout, getLayoutLabel } from '@client/components/editor/layoutEnum';
import NavigationSuspense from '@client/components/navigation/navigationSuspense';
import { Loader } from '@client/components/ui/loader';
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

	return { problem, textsById, textsByType };
}

function SiderbarNavlink({ to, label }: { to: string; label: string }) {
	return (
		<NavLink to={to} end>
			{({ isActive, isPending }) => (
				<SidebarMenuButton isActive={isActive}>
					{isPending && <Loader />}
					{label}
				</SidebarMenuButton>
			)}
		</NavLink>
	);
}

function ProblemSidebar({
	problem,
}: {
	problem: trpcOutputTypes['problem']['info'];
}) {
	const { desktopLayout, setDesktopLayout } = useEditorLayout();
	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="flex flex-col items-start h-auto">
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
							<SidebarMenuItem>
								<SiderbarNavlink
									to={''}
									label={'Editor textů'}
								/>
								<SiderbarNavlink
									to={'metadata'}
									label={'Metadata'}
								/>
								<SiderbarNavlink
									to={'work'}
									label={'Korektury a úkoly'}
								/>
								<SiderbarNavlink
									to={'files'}
									label={'Soubory'}
								/>
								<SiderbarNavlink
									to={'web-texts'}
									label={'Zveřejnění textů'}
								/>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
					<SidebarGroup>
						<SidebarGroupLabel>Layout</SidebarGroupLabel>
						<SidebarGroupContent>
							<Select
								onValueChange={(value) =>
									setDesktopLayout(value as Layout)
								}
								defaultValue={desktopLayout}
							>
								<SelectTrigger size="sm">
									<SelectValue placeholder="select layout" />
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

export default function Task({ loaderData }: Route.ComponentProps) {
	return (
		<EditorLayoutProvider textData={loaderData}>
			<SidebarProvider className="flex-1">
				<ProblemSidebar problem={loaderData.problem} />
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
