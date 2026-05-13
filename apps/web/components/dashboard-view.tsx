import { DashboardScreens, type DashboardScreenData, type ScreenId } from "./dashboard-screens";

type DashboardViewProps = {
  data: DashboardScreenData;
  userName: string;
  screen?: ScreenId;
};

export function DashboardView({ data, userName, screen = "dashboard" }: DashboardViewProps) {
  const serializableData = JSON.parse(JSON.stringify(data)) as DashboardScreenData;

  return <DashboardScreens data={serializableData} userName={userName} screen={screen} />;
}
