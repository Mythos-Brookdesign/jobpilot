import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

const VISIBLE_MS = 6000;

type UndoBannerProps = {
  message: string;
  onUndo: () => void;
  /** Wird nach Ablauf der Zeit aufgerufen */
  onDismiss: () => void;
};

/** Kurzer Hinweis mit „Rückgängig“, verschwindet nach einigen Sekunden von selbst */
export function UndoBanner({ message, onUndo, onDismiss }: UndoBannerProps) {
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <View accessibilityLiveRegion="polite" style={[styles.banner, { backgroundColor: theme.text }]}>
      <Text numberOfLines={1} style={[styles.message, { color: theme.background }]}>
        {message}
      </Text>
      <Pressable accessibilityRole="button" onPress={onUndo} hitSlop={8}>
        <Text style={[styles.action, { color: theme.background }]}>Rückgängig</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  message: {
    flex: 1,
    fontSize: 13,
  },
  action: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
