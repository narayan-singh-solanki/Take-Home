import { ScrollView, StyleSheet } from "react-native";
import { colors, spacing } from "../../theme";

import type { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, gap: spacing.md, padding: spacing.md },
});
