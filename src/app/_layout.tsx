import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, Text, View } from 'react-native';

import { DatabaseProvider } from '@/db/database-provider';
import { ApplicationsProvider } from '@/features/applications/applications-context';
import { useSchemeName, useTheme } from '@/theme/use-theme';
import AppTabs from '@/ui/app-tabs';

// Splash stehen lassen, bis die Datenbank bereit ist
SplashScreen.preventAutoHideAsync();

const hideSplash = () => SplashScreen.hide();

export default function RootLayout() {
  const scheme = useSchemeName();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider
        loading={null}
        renderError={(message) => <DatabaseError message={message} />}
        onSettled={hideSplash}>
        <ApplicationsProvider>
          <AppTabs />
        </ApplicationsProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}

function DatabaseError({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.error, { backgroundColor: theme.background }]}>
      <Text style={[styles.errorTitle, { color: theme.text }]}>
        Daten konnten nicht geladen werden
      </Text>
      <Text style={[styles.errorText, { color: theme.textSecondary }]}>
        Bitte starte die App neu. Bleibt der Fehler, hilft ein Update der App.
      </Text>
      <Text selectable style={[styles.errorDetail, { color: theme.textSecondary }]}>
        {message}
      </Text>
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
