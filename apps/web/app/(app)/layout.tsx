import { LogoutButton } from "../../components/logout-button";
import { SectionNav } from "../../components/section-nav";
import { ThemeToggle } from "../../components/theme-toggle";
import { requireCurrentUser } from "../../lib/auth";

const sections = [
  { href: "/dashboard#dashboard", label: "Dashboard", icon: "D", group: "Principal" },
  { href: "/dashboard#todo", label: "To-Do List", icon: "T", group: "Principal" },
  { href: "/dashboard#habits", label: "Hábitos", icon: "H", group: "Principal" },
  { href: "/dashboard#finance", label: "Finanzas", icon: "€", group: "Principal" },
  { href: "/dashboard#notes", label: "Bóveda de Notas", icon: "N", group: "Extras" },
  { href: "/dashboard#pomodoro", label: "Pomodoro", icon: "P", group: "Extras" }
] as const;

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();

  return (
    <div className="appShell">
      <aside className="sideNav">
        <a className="brand" href="/dashboard#dashboard" aria-label="Nexus">
          <span className="brandIcon">N</span>
          <span className="brandName">Nexus</span>
        </a>

        <SectionNav sections={sections} />

        <div className="navSpacer" />

        <div className="userCard">
          <span className="userAvatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <div className="sidebarActions">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>

      <main className="mainWrap">{children}</main>
    </div>
  );
}
