import { DashboardScreens, type DashboardScreenData, type ScreenId } from "./dashboard-screens";

type DashboardViewProps = {
  data: DashboardScreenData;
  userName: string;
  screen?: ScreenId;
};

export function DashboardView({ data, userName, screen = "dashboard" }: DashboardViewProps) {
  const serializableData: DashboardScreenData = {
    ...data,
    latestTransactions: data.latestTransactions.map((entry) => ({
      ...entry,
      occurredAt:
        entry.occurredAt instanceof Date ? entry.occurredAt.toISOString() : entry.occurredAt
    }))
  };

  return <DashboardScreens data={serializableData} userName={userName} screen={screen} />;
}
