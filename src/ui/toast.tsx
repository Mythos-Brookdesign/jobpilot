import { useEffect, useSyncExternalStore } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/use-theme';

// Kurze Hinweise über allen Screens, z. B. „Gelöscht · Rückgängig“ nach dem Zurückspringen.
// Ein kleiner Store außerhalb von React, damit jede Stelle einen Hinweis zeigen kann.

type Toast = { id: number; message: string; action?: { label: string; onPress: () => void } };

const VISIBLE_MS = 6000;
let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function setToast(toast: Toast | null) {
  current = toast;
  listeners.forEach((listener) => listener());
}

export function showToast(toast: Omit<Toast, 'id'>) {
  setToast({ ...toast, id: nextId++ });
}

export function hideToast() {
  setToast(null);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Einmal im Root-Layout einbinden */
export function ToastHost() {
  const toast = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      if (current?.id === toast.id) hideToast();
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  // Im Browser unten (oben liegt die Navigation), in der App oben (unten liegen die Tabs)
  const position = Platform.OS === 'web' ? { bottom: 24 } : { top: insets.top + 8 };

  return (
    <View pointerEvents="box-none" style={[styles.host, position]}>
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.toast, { backgroundColor: theme.text }]}>
        <Text numberOfLines={2} style={[styles.message, { color: theme.background }]}>
          {toast.message}
        </Text>
        {toast.action ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              toast.action?.onPress();
              hideToast();
            }}>
            <Text style={[styles.action, { color: theme.background }]}>{toast.action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 520,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
  },
  action: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
