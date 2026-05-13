import { getDashboard } from "@gestor/api";

import { requireCurrentUser } from "../lib/auth";
import { DashboardView } from "./dashboard-view";
import type { ScreenId } from "./dashboard-screens";

type DashboardRouteProps = {
  screen: ScreenId;
};

export async function DashboardRoute({ screen }: DashboardRouteProps) {
  const user = await requireCurrentUser();
  const data = await getDashboard(user.id);

  return <DashboardView data={data} userName={user.name} screen={screen} />;
}
