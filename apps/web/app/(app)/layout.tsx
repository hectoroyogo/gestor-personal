import { LogoutButton } from "../../components/logout-button";
import { SectionNav } from "../../components/section-nav";
import { ThemeToggle } from "../../components/theme-toggle";
import { requireCurrentUser } from "../../lib/auth";

const sections = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard#tasks", label: "Tareas" },
  { href: "/dashboard#habits", label: "Hábitos" },
  { href: "/dashboard#finance", label: "Finanzas" },
  { href: "/dashboard#savings", label: "Ahorro" }
];

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();

  return (
    <div className="shell">
      <aside className="sidebar glassPanel">
        <div>
          <p className="eyebrow">Gestor Personal</p>
          <h2 className="sidebarTitle">{user.name}</h2>
          <p className="mutedText">{user.email}</p>
        </div>

        <SectionNav sections={sections} />

        <div className="sidebarActions">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
