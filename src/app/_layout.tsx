import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, Text, View } from 'react-native';

import { DATABASE_LOCKED_MESSAGE } from '@/db/client';
import { DatabaseProvider } from '@/db/database-provider';
import { DemoBanner, DemoGate } from '@/features/demo/demo-banner';
import { ReminderService } from '@/features/reminders/reminder-service';
import { useSchemeName, useTheme } from '@/theme/use-theme';
import { ToastHost } from '@/ui/toast';

// Splash stehen lassen, bis die Datenbank bereit ist
SplashScreen.preventAutoHideAsync();

const hideSplash = () => SplashScreen.hide();

export default function RootLayout() {
  const scheme = useSchemeName();
  const theme = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  // Farben der Navigation (Header, Hintergründe) an das App-Theme anpassen
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.accentText,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <DatabaseProvider
        loading={null}
        renderError={(message) => <DatabaseError message={message} />}
        onSettled={hideSplash}>
        <DemoGate>
          <DemoBanner />
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
              headerTitleStyle: { fontWeight: '600' },
              contentStyle: { backgroundColor: theme.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="bewerbung/[id]/index" options={{ title: '' }} />
            <Stack.Screen
              name="bewerbung/neu"
              options={{ presentation: 'modal', title: 'Neue Bewerbung' }}
            />
            <Stack.Screen
              name="bewerbung/[id]/bearbeiten"
              options={{ presentation: 'modal', title: 'Bewerbung bearbeiten' }}
            />
            <Stack.Screen
              name="bewerbung/[id]/termin"
              options={{ presentation: 'modal', title: 'Termin' }}
            />
            <Stack.Screen
              name="bewerbung/[id]/kontakt"
              options={{ presentation: 'modal', title: 'Kontakt' }}
            />
            <Stack.Screen
              name="bewerbung/[id]/erinnerung"
              options={{ presentation: 'modal', title: 'Neue Erinnerung' }}
            />
            <Stack.Screen
              name="bewerbung/aus-anzeige"
              options={{ presentation: 'modal', title: 'Aus Stellenanzeige' }}
            />
            <Stack.Screen
              name="bewerbung/[id]/ki"
              options={{ presentation: 'modal', title: 'KI-Assistent' }}
            />
            <Stack.Screen name="ueber" options={{ title: 'Über jobpilot' }} />
          </Stack>
        </DemoGate>
        <ReminderService />
        <ToastHost />
      </DatabaseProvider>
    </ThemeProvider>
  );
}

function DatabaseError({ message }: { message: string }) {
  const theme = useTheme();
  const locked = message === DATABASE_LOCKED_MESSAGE;
  return (
    <View style={[styles.error, { backgroundColor: theme.background }]}>
      <Text style={[styles.errorTitle, { color: theme.text }]}>
        {locked ? 'Schon in einem anderen Tab geöffnet' : 'Daten konnten nicht geladen werden'}
      </Text>
      <Text style={[styles.errorText, { color: theme.textSecondary }]}>
        {locked
          ? message
          : 'Bitte starte die App neu. Bleibt der Fehler, hilft ein Update der App.'}
      </Text>
      {locked ? null : (
        <Text selectable style={[styles.errorDetail, { color: theme.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 21,
  },
  errorDetail: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 8,
  },
});
