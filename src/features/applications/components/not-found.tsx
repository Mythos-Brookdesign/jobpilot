import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';
import { Button } from '@/ui/button';
import { useGoBack } from '@/ui/navigation';

/** Für gelöschte oder unbekannte Bewerbungen, z. B. nach einem alten Link */
export function NotFound() {
  const theme = useTheme();
  const goBack = useGoBack('/bewerbungen');
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Bewerbung nicht gefunden</Text>
      <Text style={[styles.text, { color: theme.textSecondary }]}>
        Sie wurde gelöscht oder existiert nicht mehr.
      </Text>
      <Button label="Zur Übersicht" variant="secondary" onPress={goBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
});
