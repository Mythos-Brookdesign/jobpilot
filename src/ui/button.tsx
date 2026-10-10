import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { useTheme } from '@/theme/use-theme';

type ButtonProps = Pick<PressableProps, 'onPress' | 'disabled' | 'accessibilityHint'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: SymbolViewProps['name'];
  /** Kleinere Variante für Listen und Kopfzeilen */
  compact?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  icon,
  compact,
  disabled,
  ...pressableProps
}: ButtonProps) {
  const theme = useTheme();
  const colors = {
    primary: { background: theme.accent, border: theme.accent, text: theme.onAccent },
    secondary: {
      background: theme.backgroundElement,
      border: theme.backgroundSelected,
      text: theme.text,
    },
    danger: { background: 'transparent', border: theme.backgroundSelected, text: theme.danger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...pressableProps}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        { backgroundColor: colors.background, borderColor: colors.border },
        (pressed || disabled) && styles.dimmed,
      ]}>
      {icon ? <SymbolView name={icon} tintColor={colors.text} size={compact ? 14 : 16} /> : null}
      <Text style={[styles.label, compact && styles.compactLabel, { color: colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 18,
  },
  compact: {
    minHeight: 36,
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  dimmed: {
    opacity: 0.6,
  },
});
