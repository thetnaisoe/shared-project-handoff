import { toast } from "sonner";
import { api } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { usePresenterMode } from "./presenter";

export function TopBar() {
  const link = "text-sm text-muted-foreground hover:text-foreground";
  const active = { className: "text-sm font-medium text-primary" };
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-semibold text-foreground">
          Lab2Markt
        </Link>
        <nav className="flex gap-6">
          <Link to="/" className={link} activeProps={active} activeOptions={{ exact: true }}>
            New idea
          </Link>
          <Link to="/evidence" className={link} activeProps={active}>
            Evidence
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  const presenter = usePresenterMode();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      {presenter && (
        <footer className="border-t">
          <div className="mx-auto flex max-w-5xl items-center justify-end gap-4 px-6 py-4">
            <span className="text-xs text-muted-foreground">Presenter mode</span>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={async () => {
                try {
                  await api.resetDemo();
                  toast.success("Demo reset");
                  setTimeout(() => window.location.reload(), 800);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not reset demo");
                }
              }}
            >
              Reset demo
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

export function PlaceholderCard({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">Screen</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      {detail && <p className="mt-2 text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}
