import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLive, useRepositories } from '@/db/hooks';
import {
  FILTER_LABELS,
  SORT_LABELS,
  SORT_ORDERS,
  countByFilter,
  filterApplications,
  isSortOrder,
  isStatusFilter,
  sortApplications,
  type SortOrder,
  type StatusFilter,
} from '@/domain/application';
import { ApplicationRow } from '@/features/applications/components/application-row';
import { KanbanBoard } from '@/features/applications/components/kanban-board';
import { StatusFilterBar } from '@/features/applications/components/status-filter';
import { SerifFont } from '@/theme/colors';
import { useTheme } from '@/theme/use-theme';
import { CONTENT_MAX_WIDTH } from '@/ui/screen';
import { SearchField } from '@/ui/search-field';
import { SegmentedControl } from '@/ui/segmented-control';

/** Ab dieser Breite gibt es zusätzlich die Board-Ansicht */
const BOARD_MIN_WIDTH = 900;

type ViewMode = 'list' | 'board';

export default function ApplicationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { settings } = useRepositories();
  const params = useLocalSearchParams<{ filter?: string }>();

  // Zuletzt gewählte Einstellungen wiederherstellen; ein Filter aus dem Link hat Vorrang
  const [filter, setFilterState] = useState<StatusFilter>(() => {
    const saved = settings.get('applications.filter');
    return isStatusFilter(params.filter) ? params.filter : isStatusFilter(saved) ? saved : 'all';
  });
  const [sort, setSortState] = useState<SortOrder>(() => {
    const saved = settings.get('applications.sort');
    return isSortOrder(saved) ? saved : 'newest';
  });
  const [view, setViewState] = useState<ViewMode>(() =>
    settings.get('applications.view') === 'board' ? 'board' : 'list',
  );
  const [query, setQuery] = useState('');

  // Wechsel über die Kennzahlen der Übersicht, während der Tab schon offen ist:
  // neuen Link-Parameter beim Rendern übernehmen (React-Muster statt Effekt)
  const [linkedFilter, setLinkedFilter] = useState(params.filter);
  if (params.filter !== linkedFilter) {
    setLinkedFilter(params.filter);
    if (isStatusFilter(params.filter)) setFilterState(params.filter);
  }

  const setFilter = (next: StatusFilter) => {
    setFilterState(next);
    settings.set('applications.filter', next);
  };
  const setSort = (next: SortOrder) => {
    setSortState(next);
    settings.set('applications.sort', next);
  };
  const setView = (next: ViewMode) => {
    setViewState(next);
    settings.set('applications.view', next);
  };

  const { applications, nextAppointments } = useLive(
    (repositories) => ({
      applications: repositories.applications.listActive(),
      nextAppointments: repositories.details.nextAppointmentByApplication(),
    }),
    ['applications', 'appointments'],
  );

  const showBoard = width >= BOARD_MIN_WIDTH && view === 'board';
  const counts = countByFilter(applications);
  // Auf dem Board zeigt jede Spalte einen Status – dort wirkt nur die Suche
  const visible = sortApplications(
    filterApplications(applications, { filter: showBoard ? 'all' : filter, query }),
    sort,
    nextAppointments,
  );
  const openApplication = (id: string) =>
    router.push({ pathname: '/bewerbung/[id]', params: { id } });

  const header = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.accentText }]}>DEINE PIPELINE</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
            Bewerbungen
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bewerbung hinzufügen"
          onPress={() => router.push('/bewerbung/neu')}
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

      <View style={styles.search}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Firma, Position, Ort oder Quelle"
          accessibilityLabel="Bewerbungen suchen"
        />
      </View>

      {width >= BOARD_MIN_WIDTH ? (
        <View style={styles.viewToggle}>
          <SegmentedControl
            options={[
              { value: 'list', label: 'Liste' },
              { value: 'board', label: 'Board' },
            ]}
            value={view}
            onChange={setView}
          />
        </View>
      ) : null}

      {showBoard ? null : <StatusFilterBar value={filter} counts={counts} onChange={setFilter} />}

      <View style={styles.listHeading}>
        <Text style={[styles.listTitle, { color: theme.text }]}>
          {showBoard ? 'Alle Bewerbungen' : FILTER_LABELS[filter]}
          <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
            {'  '}
            {visible.length}
          </Text>
        </Text>
        <View style={styles.sort} accessibilityLabel="Sortierung">
          {SORT_ORDERS.map((order) => (
            <Pressable
              key={order}
              accessibilityRole="button"
              accessibilityState={{ selected: sort === order }}
              onPress={() => setSort(order)}
              hitSlop={6}>
              <Text
                style={[
                  styles.sortOption,
                  {
                    color: sort === order ? theme.accentText : theme.textSecondary,
                    fontWeight: sort === order ? '700' : '500',
                  },
                ]}>
                {SORT_LABELS[order]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const empty = (
    <View style={[styles.emptyState, { borderColor: theme.backgroundSelected }]}>
      <SymbolView
        name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
        tintColor={theme.textSecondary}
        size={27}
      />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {applications.length === 0 ? 'Noch keine Bewerbungen' : 'Nichts gefunden'}
      </Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {applications.length === 0
          ? 'Tippe auf +, um deine erste Bewerbung anzulegen.'
          : 'Passe Suche oder Filter an.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {showBoard ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, styles.wide]}>
          {header}
          <KanbanBoard
            applications={visible}
            nextAppointments={nextAppointments}
            onOpen={openApplication}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(application) => application.id}
          renderItem={({ item }) => (
            <ApplicationRow
              application={item}
              nextAppointment={nextAppointments.get(item.id)}
              onPress={() => openApplication(item.id)}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        />
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
    maxWidth: 1800,
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
  search: {
    marginTop: 20,
  },
  viewToggle: {
    marginTop: 14,
    marginBottom: -15,
    maxWidth: 260,
  },
  listHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 6,
  },
  listTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '400',
  },
  sort: {
    flexDirection: 'row',
    gap: 12,
  },
  sortOption: {
    fontSize: 12,
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
