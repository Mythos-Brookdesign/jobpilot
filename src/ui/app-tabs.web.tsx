import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useTheme } from '@/theme/use-theme';

// Im Browser: Navigationsleiste oben statt nativer Tab-Bar.
// Schmale Fenster: ohne Wortmarke, die Tabs teilen sich die Breite.
const NARROW = 640;
export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Expo Router sucht die TabTrigger nur eine Ebene unter <TabList asChild> */}
      <TabList asChild>
        <TabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Übersicht</TabButton>
          </TabTrigger>
          <TabTrigger name="bewerbungen" href="/bewerbungen" asChild>
            <TabButton>Bewerbungen</TabButton>
          </TabTrigger>
          <TabTrigger name="auswertung" href="/auswertung" asChild>
            <TabButton>Auswertung</TabButton>
          </TabTrigger>
          <TabTrigger name="einstellungen" href="/einstellungen" asChild>
            <TabButton>Einstellungen</TabButton>
          </TabTrigger>
        </TabBar>
      </TabList>
      <TabSlot style={styles.slot} />
    </Tabs>
  );
}

function TabBar({ children, style, ...props }: TabListProps) {
  const theme = useTheme();
  const narrow = useWindowDimensions().width < NARROW;

  return (
    <View {...props} style={[styles.bar, { borderBottomColor: theme.border }, style]}>
      <View style={[styles.inner, narrow && styles.innerNarrow]}>
        {narrow ? null : (
          <Text style={[styles.brand, { color: theme.text }]}>
            jobpilot<Text style={{ color: theme.accentText }}>.</Text>
          </Text>
        )}
        {children}
      </View>
    </View>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();
  const narrow = useWindowDimensions().width < NARROW;

  return (
    <Pressable
      {...props}
      accessibilityRole="link"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tab,
        narrow && styles.tabNarrow,
        isFocused && { backgroundColor: theme.backgroundSelected },
        pressed && styles.pressed,
      ]}>
      <Text
        numberOfLines={1}
        style={[
          styles.tabText,
          narrow && styles.tabTextNarrow,
          { color: isFocused ? theme.text : theme.textSecondary },
        ]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  innerNarrow: {
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 'auto',
  },
  tab: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabNarrow: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextNarrow: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
  slot: {
    flex: 1,
  },
});
