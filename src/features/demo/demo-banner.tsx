import { useRouter } from 'expo-router';
import { useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRepositories } from '@/db/hooks';
import { isDemo, resetDemo, seedDemoIfEmpty } from '@/features/demo/mode';
import { useTheme } from '@/theme/use-theme';
import { confirm } from '@/ui/dialogs';
import { showToast } from '@/ui/toast';

/** Lädt in der Demo beim allerersten Rendern die Beispieldaten – bevor ein Screen sie liest */
export function DemoGate({ children }: PropsWithChildren) {
  const repositories = useRepositories();
  // Einmalig und synchron: die Datenbank ist hier bereits offen und migriert
  useState(() => {
    if (isDemo) seedDemoIfEmpty(repositories);
    return true;
  });
  return children;
}

/** Hinweisband der Web-Demo */
export function DemoBanner() {
  const theme = useTheme();
  const router = useRouter();
  const repositories = useRepositories();
  if (!isDemo) return null;

  async function reset() {
    const confirmed = await confirm({
      title: 'Demo zurücksetzen?',
      message: 'Deine Änderungen werden verworfen und die Beispieldaten neu geladen.',
      confirmLabel: 'Zurücksetzen',
    });
    if (!confirmed) return;
    resetDemo(repositories);
    router.replace('/');
    showToast({ message: 'Demo zurückgesetzt' });
  }

  return (
    <View role="banner" style={[styles.banner, { backgroundColor: theme.accent }]}>
      <Text style={[styles.text, { color: theme.onAccent }]}>
        <Text style={styles.strong}>Demo</Text> · Beispieldaten, alles bleibt in deinem Browser
      </Text>
      <View style={styles.links}>
        <Pressable accessibilityRole="link" hitSlop={6} onPress={() => router.push('/ueber')}>
          <Text style={[styles.link, { color: theme.onAccent }]}>Über das Projekt</Text>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={6} onPress={reset}>
          <Text style={[styles.link, { color: theme.onAccent }]}>Zurücksetzen</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 16,
    rowGap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontSize: 13,
  },
  strong: {
    fontWeight: '700',
  },
  links: {
    flexDirection: 'row',
    gap: 14,
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
