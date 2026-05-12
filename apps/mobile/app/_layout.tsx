import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#07111f"
          },
          headerTintColor: "#e2e8f0",
          contentStyle: {
            backgroundColor: "#07111f"
          }
        }}
      />
    </>
  );
}

