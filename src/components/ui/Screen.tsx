import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
export function Screen({ children }: PropsWithChildren) { return <SafeAreaView edges={['left', 'right']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}>{children}</ScrollView></SafeAreaView>; }
const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: colors.background }, content: { flexGrow: 1, gap: spacing.md, padding: spacing.md } });
