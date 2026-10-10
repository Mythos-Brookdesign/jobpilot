import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { filterApplications, type StatusFilter } from '@/domain/application';
import { useApplications } from '@/features/applications/applications-context';
import { ApplicationDetails } from '@/features/applications/components/application-details';
import { ApplicationRow } from '@/features/applications/components/application-row';
import { NewApplicationForm } from '@/features/applications/components/new-application-form';
import { filterLabel, StatusFilterBar } from '@/features/applications/components/status-filter';
import { SerifFont } from '@/theme/colors';
import { useTheme } from '@/theme/use-theme';
import { SearchField } from '@/ui/search-field';
import { Sheet } from '@/ui/sheet';

type ActiveSheet = { mode: 'create' } | { mode: 'details'; id: string } | null;

export default function ApplicationsScreen() {
  const theme = useTheme();
  const { applications } = useApplications();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const visibleApplications = filterApplications(applications, { status: filter, query });
  const selectedApplication =
    activeSheet?.mode === 'details'
      ? applications.find((application) => application.id === activeSheet.id)
      : undefined;
  const closeSheet = () => setActiveSheet(null);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.accentText }]}>DEINE PIPELINE</Text>
            <Text style={[styles.title, { color: theme.text }]}>Bewerbungen</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bewerbung hinzufügen"
            onPress={() => setActiveSheet({ mode: 'create' })}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor={theme.onAccent}
              size={20}
            />
          </Pressable>
        </View>
        <Text style={[styles.summary, { color: theme.textSecondary }]}>
          {applications.length} {applications.length === 1 ? 'Bewerbung' : 'Bewerbungen'} · jeder
          Schritt zählt
        </Text>

        <View style={styles.search}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Unternehmen oder Position suchen"
            accessibilityLabel="Bewerbungen suchen"
          />
        </View>
        <StatusFilterBar value={filter} onChange={setFilter} />

        <View style={styles.listHeading}>
          <Text style={[styles.listTitle, { color: theme.text }]}>
            {filter === 'all' ? 'Alle Einträge' : filterLabel(filter)}
          </Text>
          <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
            {visibleApplications.length}
          </Text>
        </View>

        {visibleApplications.length > 0 ? (
          visibleApplications.map((application) => (
            <ApplicationRow
              application={application}
              key={application.id}
              onPress={() => setActiveSheet({ mode: 'details', id: application.id })}
            />
          ))
        ) : (
          <View style={[styles.emptyState, { borderColor: theme.backgroundSelected }]}>
            <SymbolView
              name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
              tintColor={theme.textSecondary}
              size={27}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Noch nichts gefunden</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Passe deine Suche an oder füge eine Bewerbung hinzu.
            </Text>
          </View>
        )}
      </ScrollView>

      <Sheet
        visible={activeSheet !== null}
        onClose={closeSheet}
        eyebrow={activeSheet?.mode === 'details' ? 'BEWERBUNG' : 'NEUER EINTRAG'}
        title={
          activeSheet?.mode === 'details' ? selectedApplication?.company : 'Bewerbung hinzufügen'
        }>
        {activeSheet?.mode === 'create' ? (
          <NewApplicationForm onSaved={closeSheet} />
        ) : selectedApplication ? (
          <ApplicationDetails application={selectedApplication} />
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 42,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: {
    gap: 5,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: {
    fontFamily: SerifFont,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '400',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  summary: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  search: {
    marginTop: 23,
  },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
    paddingBottom: 5,
  },
  listTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  emptyText: {
    maxWidth: 240,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});
