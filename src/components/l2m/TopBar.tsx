import { Link } from "@tanstack/react-router";

export function TopBar() {
  const link = "text-sm text-muted-foreground hover:text-foreground";
  const active = { className: "text-sm font-medium text-primary" };
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-semibold text-foreground">Lab to Market</Link>
        <nav className="flex gap-6">
          <Link to="/" className={link} activeProps={active} activeOptions={{ exact: true }}>New idea</Link>
          <Link to="/evidence" className={link} activeProps={active}>Evidence</Link>
        </nav>
      </div>
    </header>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
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
