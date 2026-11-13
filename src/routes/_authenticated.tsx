import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, FolderOpen, Calculator, FlaskConical, ShieldAlert, FileText, LineChart, Settings, Atom, LogOut, Plus, BookOpen } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loading } from "@/components/app/ui-bits";

export const Route = createFileRoute("/_authenticated")({ component: Layout });

const NAV = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Projects", url: "/projects", icon: FolderOpen },
  { title: "New Assessment", url: "/new-assessment", icon: Plus },
  { title: "Market Research", url: "/market-research", icon: LineChart },
  { title: "Evidence Ledger", url: "/evidence", icon: BookOpen },
  { title: "Risk Analysis", url: "/risk-analysis", icon: ShieldAlert },
  { title: "Experiment Planner", url: "/experiment-planner", icon: FlaskConical },
  { title: "Reports", url: "/commercial-reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

function Layout() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);
  if (loading || !session) return <Loading />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="no-print">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-1 py-2 font-display text-lg font-bold tracking-wide text-sidebar-accent-foreground">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Atom className="h-5 w-5" /></span>
              <span className="group-data-[collapsible=icon]:hidden">Lab2Markt</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV.map((n) => (
                    <SidebarMenuItem key={n.url}>
                      <SidebarMenuButton asChild isActive={path.startsWith(n.url)} tooltip={n.title}>
                        <Link to={n.url}><n.icon className="h-4 w-4" /><span>{n.title}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Sign out" onClick={() => supabase.auth.signOut()}>
                  <LogOut className="h-4 w-4" /><span className="truncate">Sign out · {session.user.email}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur no-print">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground">Workspace <span className="mx-2">/</span> Commercial intelligence</span>
            <span className="ml-auto hidden rounded border px-2 py-1 text-[10px] font-semibold text-primary sm:block">GEMINI POWERED</span>
          </header>
          <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
