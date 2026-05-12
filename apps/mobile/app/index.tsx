import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";

import { ScreenCard } from "../components/screen-card";
import { apiBaseUrl } from "../lib/config";

type HealthState = {
  status: "idle" | "loading" | "ok" | "error";
  message: string;
};

export default function HomeScreen() {
  const [health, setHealth] = useState<HealthState>({
    status: "loading",
    message: "Comprobando backend..."
  });

  useEffect(() => {
    let cancelled = false;

    async function checkBackend() {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        const data = (await response.json()) as { status: string };

        if (!cancelled) {
          setHealth({
            status: "ok",
            message: `Backend ${data.status} en ${apiBaseUrl}`
          });
        }
      } catch {
        if (!cancelled) {
          setHealth({
            status: "error",
            message: `No se pudo alcanzar ${apiBaseUrl}`
          });
        }
      }
    }

    void checkBackend();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenCard
          title="Gestor Personal Mobile"
          subtitle="Scaffold Expo listo para conectarse al backend compartido."
        >
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Estado:</Text>
            <Text style={[styles.statusValue, health.status === "error" && styles.errorText]}>
              {health.message}
            </Text>
          </View>

          <Link href="/overview" style={styles.link}>
            Abrir visión general
          </Link>
        </ScreenCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#07111f"
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center"
  },
  statusRow: {
    gap: 4
  },
  statusLabel: {
    color: "#94a3b8",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  statusValue: {
    color: "#34d399",
    fontSize: 16
  },
  errorText: {
    color: "#f87171"
  },
  link: {
    marginTop: 18,
    color: "#60a5fa",
    fontSize: 16,
    fontWeight: "700"
  }
});

