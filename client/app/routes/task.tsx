import { NavLink, Outlet } from 'react-router';

import { Layout, getLayoutLabel } from '@client/components/editor/layoutEnum';
import NavigationSuspense from '@client/components/navigation/navigationSuspense';
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

import { Route } from './+types/task';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const texts = await trpc.problem.texts.query({
		taskId: parseInt(params.taskId),
	});

	const textsById = new Map<number, trpcOutputTypes['problem']['texts'][0]>();
	const textsByType = new Map<string, trpcOutputTypes['problem']['texts']>();

	for (const text of texts) {
		textsById.set(text.textId, text);

		const textsOfSameType = textsByType.get(text.type) ?? [];
		textsOfSameType.push(text);
		textsByType.set(text.type, textsOfSameType);
	}

	return { textsById, textsByType };
}

function ProblemSidebar() {
	const { desktopLayout, setDesktopLayout } = useEditorLayout();
	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Úloha</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<NavLink to={''}>Edit</NavLink>
								</SidebarMenuButton>
								<SidebarMenuButton asChild>
									<NavLink to={'metadata'}>Metadata</NavLink>
								</SidebarMenuButton>
								<SidebarMenuButton asChild>
									<NavLink to={'work'}>Korektury</NavLink>
								</SidebarMenuButton>
								<SidebarMenuButton asChild>
									<NavLink to={'files'}>Soubory</NavLink>
								</SidebarMenuButton>
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
										<SelectItem value={layout}>
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
				<ProblemSidebar />
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
