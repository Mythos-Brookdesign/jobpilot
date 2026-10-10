import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

type SectionProps = PropsWithChildren<{
  title: string;
  /** z. B. ein „Hinzufügen“-Button rechts neben dem Titel */
  action?: ReactNode;
  /** Inhalt ohne Kartenrahmen darstellen */
  plain?: boolean;
}>;

export function Section({ title, action, plain, children }: SectionProps) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.textSecondary }]}>
          {title}
        </Text>
        {action}
      </View>
      {plain ? (
        children
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
    gap: 8,
  },
  header: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
