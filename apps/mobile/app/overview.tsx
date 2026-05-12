import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";

import { ScreenCard } from "../components/screen-card";

const capabilities = [
  "Auth contra backend propio",
  "Consumo de /api/dashboard",
  "Pantallas específicas para tareas y hábitos",
  "Reutilización de tipos y validaciones compartidas"
];

export default function OverviewScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenCard
          title="Próximos pasos móvil"
          subtitle="La app nativa se deja lista para crecer sin arrastrar la UI del dashboard web."
        >
          <View style={styles.list}>
            {capabilities.map((item) => (
              <View key={item} style={styles.item}>
                <View style={styles.dot} />
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
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
  list: {
    gap: 14
  },
  item: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#34d399"
  },
  itemText: {
    color: "#e2e8f0",
    fontSize: 16
  }
});
