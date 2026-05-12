import { DashboardScreens, type DashboardScreenData } from "./dashboard-screens";

type DashboardViewProps = {
  data: DashboardScreenData;
  userName: string;
};

export function DashboardView({ data, userName }: DashboardViewProps) {
  const serializableData: DashboardScreenData = {
    ...data,
    latestTransactions: data.latestTransactions.map((entry) => ({
      ...entry,
      occurredAt:
        entry.occurredAt instanceof Date ? entry.occurredAt.toISOString() : entry.occurredAt
    }))
  };

  return <DashboardScreens data={serializableData} userName={userName} />;
}
