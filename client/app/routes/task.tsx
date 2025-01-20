import { NavLink, Outlet } from "react-router";
import NavigationSuspense from "~/components/navigation/navigationSuspense";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";

export default function Task() {
	return <SidebarProvider className="flex-1">
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
									<NavLink to={''}>Obrázky</NavLink>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
		<main className="w-full">
			<SidebarTrigger />
			<NavigationSuspense>
				<Outlet />
			</NavigationSuspense>
		</main>
	</SidebarProvider>
}
