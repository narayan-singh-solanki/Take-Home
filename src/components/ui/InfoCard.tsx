import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
export function InfoCard({ children }: PropsWithChildren) { return <View style={styles.card}>{children}</View>; }
const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, gap: spacing.sm, padding: spacing.md } });
