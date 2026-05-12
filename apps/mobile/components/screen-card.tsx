import type { PropsWithChildren } from "react";
import { View, Text, StyleSheet } from "react-native";

type ScreenCardProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function ScreenCard({ title, subtitle, children }: ScreenCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "rgba(15,23,42,0.76)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    gap: 10
  },
  title: {
    color: "#e2e8f0",
    fontSize: 28,
    fontWeight: "800"
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 22
  },
  content: {
    marginTop: 8
  }
});

