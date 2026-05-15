import { getDashboardOverview, getFinanceScreen, listHabitsForScreen, listTasks } from "@gestor/api";

import { requireCurrentUser } from "../lib/auth";
import { AgendaScreen } from "./agenda-screen";
import { DashboardHomeScreen } from "./dashboard-home-screen";
import { FinanceScreen } from "./finance-screen";
import { HabitsScreen } from "./habits-screen";
import { NotesScreen } from "./notes-screen";
import { PomodoroScreen } from "./pomodoro-screen";
import { TodoScreen } from "./todo-screen";

export type ScreenId = "dashboard" | "todo" | "habits" | "finance" | "notes" | "pomodoro" | "agenda";

type DashboardRouteProps = {
  screen: ScreenId;
};

export async function DashboardRoute({ screen }: DashboardRouteProps) {
  const user = await requireCurrentUser();

  if (screen === "todo") {
    return <TodoScreen tasks={await listTasks(user.id)} />;
  }

  if (screen === "habits") {
    return <HabitsScreen habits={await listHabitsForScreen(user.id)} />;
  }

  if (screen === "finance") {
    return <FinanceScreen data={await getFinanceScreen(user.id)} />;
  }

  if (screen === "notes") {
    return <NotesScreen />;
  }

  if (screen === "pomodoro") {
    return <PomodoroScreen />;
  }

  if (screen === "agenda") {
    return <AgendaScreen />;
  }

  return <DashboardHomeScreen data={await getDashboardOverview(user.id)} userName={user.name} />;
}
