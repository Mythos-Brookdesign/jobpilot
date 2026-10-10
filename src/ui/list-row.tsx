import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { useTheme } from '@/theme/use-theme';

type ListRowProps = {
  icon?: SymbolViewProps['name'];
  title: string;
  subtitle?: string;
  /** Hebt die Zeile hervor, z. B. für anstehende Termine */
  highlight?: boolean;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
  first?: boolean;
};

export function ListRow({
  icon,
  title,
  subtitle,
  highlight,
  trailing,
  onPress,
  accessibilityHint,
  first,
}: ListRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={accessibilityHint}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
        pressed && styles.pressed,
      ]}>
      {icon ? (
        <View
          style={[
            styles.icon,
            { backgroundColor: highlight ? theme.accentSoft : theme.backgroundSelected },
          ]}>
          <SymbolView
            name={icon}
            tintColor={highlight ? theme.accentText : theme.textSecondary}
            size={16}
          />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.6,
  },
});
