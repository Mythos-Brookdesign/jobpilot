import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';

import { ApplicationsProvider } from '@/features/applications/applications-context';
import { useSchemeName } from '@/theme/use-theme';
import AppTabs from '@/ui/app-tabs';

export default function RootLayout() {
  const scheme = useSchemeName();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ApplicationsProvider>
        <AppTabs />
      </ApplicationsProvider>
    </ThemeProvider>
  );
}
