import { getDashboard } from "@gestor/api";

import { DashboardView } from "../../../components/dashboard-view";
import { requireCurrentUser } from "../../../lib/auth";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const data = await getDashboard(user.id);

  return <DashboardView data={data} userName={user.name} />;
}

