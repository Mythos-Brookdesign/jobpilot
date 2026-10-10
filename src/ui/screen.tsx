import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/use-theme';

export const CONTENT_MAX_WIDTH = 760;

type ScreenProps = PropsWithChildren<{
  /** Tabs haben keinen Header und brauchen Abstand zur Statusleiste; Stack-Screens nicht */
  safeTop?: boolean;
  /** Breiter Inhalt, z. B. das Kanban-Board */
  wide?: boolean;
  scroll?: boolean;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
}>;

/** Hintergrund, Safe Area und zentrierte, begrenzte Inhaltsbreite für alle Screens */
export function Screen({
  safeTop = false,
  wide = false,
  scroll = true,
  keyboardShouldPersistTaps = 'handled',
  children,
}: ScreenProps) {
  const theme = useTheme();
  const content = [styles.content, wide && styles.wide];

  return (
    <SafeAreaView
      edges={safeTop ? ['top'] : []}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={content}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[content, styles.fill]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 48,
  },
  wide: {
    maxWidth: 1400,
  },
  fill: {
    flex: 1,
    paddingBottom: 0,
  },
});
