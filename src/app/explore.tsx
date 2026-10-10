import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApplicationStatusBadge } from '@/components/application-status';
import { JobApplicationRow } from '@/components/job-application-row';
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/data/applications';
import { useApplications } from '@/contexts/applications-context';
import { useTheme } from '@/hooks/use-theme';

const ACCENT = '#176B4A';
type FilterStatus = 'Alle' | ApplicationStatus;
type ActiveModal = { mode: 'create' } | { mode: 'details'; id: string } | null;

export default function ApplicationsScreen() {
  const theme = useTheme();
  const { applications, addApplication, updateApplicationStatus } = useApplications();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('Alle');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [formError, setFormError] = useState('');
  const selectedApplication =
    activeModal?.mode === 'details'
      ? applications.find((application) => application.id === activeModal.id)
      : undefined;
  const normalizedQuery = query.trim().toLocaleLowerCase('de-DE');
  const visibleApplications = applications.filter((application) => {
    const matchesFilter = filter === 'Alle' || application.status === filter;
    const matchesQuery =
      !normalizedQuery ||
      `${application.company} ${application.role} ${application.location}`
        .toLocaleLowerCase('de-DE')
        .includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  });

  function openCreateModal() {
    setCompany('');
    setRole('');
    setLocation('');
    setFormError('');
    setActiveModal({ mode: 'create' });
  }

  function saveApplication() {
    if (!company.trim() || !role.trim()) {
      setFormError('Bitte Unternehmen und Position ausfüllen.');
      return;
    }
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    addApplication({
      company: company.trim(),
      role: role.trim(),
      location: location.trim() || 'Ort nicht angegeben',
      appliedAt: date.toISOString().slice(0, 10),
      status: 'Gesendet',
    });
    setActiveModal(null);
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>DEINE PIPELINE</Text>
            <Text style={[styles.title, { color: theme.text }]}>Bewerbungen</Text>
          </View>
          <Pressable
              accessibilityRole="button"
            accessibilityLabel="Bewerbung hinzufügen"
            onPress={openCreateModal}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor="#FFFFFF"
              size={20}
            />
          </Pressable>
        </View>
        <Text style={[styles.summary, { color: theme.textSecondary }]}>
          {applications.length} {applications.length === 1 ? 'Bewerbung' : 'Bewerbungen'} · jeder Schritt zählt
        </Text>

        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor={theme.textSecondary}
            size={18}
          />
          <TextInput
            accessibilityLabel="Bewerbungen suchen"
            value={query}
            onChangeText={setQuery}
            placeholder="Unternehmen oder Position suchen"
            placeholderTextColor={theme.textSecondary}
            returnKeyType="search"
            style={[styles.searchInput, { color: theme.text }]}
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Suche löschen"
              onPress={() => setQuery('')}
              hitSlop={8}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                tintColor={theme.textSecondary}
                size={18}
              />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['Alle', ...APPLICATION_STATUSES] as FilterStatus[]).map((status) => {
            const selected = filter === status;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={status}
                onPress={() => setFilter(status)}
                style={[
                  styles.filter,
                  {
                    backgroundColor: selected ? ACCENT : theme.backgroundElement,
                    borderColor: selected ? ACCENT : theme.backgroundSelected,
                  },
                ]}>
                <Text style={[styles.filterText, { color: selected ? '#FFFFFF' : theme.textSecondary }]}>
                  {status}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.listHeading}>
          <Text style={[styles.listTitle, { color: theme.text }]}>
            {filter === 'Alle' ? 'Alle Einträge' : filter}
          </Text>
          <Text style={[styles.resultCount, { color: theme.textSecondary }]}>{visibleApplications.length}</Text>
        </View>

        {visibleApplications.length > 0 ? (
          visibleApplications.map((application) => (
            <JobApplicationRow
              application={application}
              key={application.id}
              onPress={() => setActiveModal({ mode: 'details', id: application.id })}
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

      <Modal
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
        transparent
        visible={activeModal !== null}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dialog schließen"
            onPress={() => setActiveModal(null)}
            style={StyleSheet.absoluteFill}
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={[styles.sheetEyebrow, { color: theme.textSecondary }]}>
                    {activeModal?.mode === 'details' ? 'BEWERBUNG' : 'NEUER EINTRAG'}
                  </Text>
                  <Text style={[styles.sheetTitle, { color: theme.text }]}>
                    {activeModal?.mode === 'details' ? selectedApplication?.company : 'Bewerbung hinzufügen'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Schließen"
                  onPress={() => setActiveModal(null)}
                  style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
                  <SymbolView
                    name={{ ios: 'xmark', android: 'close', web: 'close' }}
                    tintColor={theme.text}
                    size={15}
                  />
                </Pressable>
              </View>

              {activeModal?.mode === 'create' ? (
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <FormField
                    label="Unternehmen"
                    value={company}
                    onChangeText={setCompany}
                    placeholder="z. B. Nordlicht Studio"
                    theme={theme}
                  />
                  <FormField
                    label="Position"
                    value={role}
                    onChangeText={setRole}
                    placeholder="z. B. Product Designer"
                    theme={theme}
                  />
                  <FormField
                    label="Ort oder Arbeitsmodell"
                    value={location}
                    onChangeText={setLocation}
                    placeholder="z. B. Berlin oder Remote"
                    theme={theme}
                  />
                  {formError ? <Text style={styles.formError}>{formError}</Text> : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={saveApplication}
                    style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
                    <Text style={styles.submitText}>Bewerbung speichern</Text>
                  </Pressable>
                </ScrollView>
              ) : selectedApplication ? (
                <View>
                  <Text style={[styles.detailRole, { color: theme.text }]}>{selectedApplication.role}</Text>
                  <Text style={[styles.detailLocation, { color: theme.textSecondary }]}>
                    {selectedApplication.location}
                  </Text>
                  <Text style={[styles.statusPrompt, { color: theme.textSecondary }]}>Status aktualisieren</Text>
                  <View style={styles.statusOptions}>
                    {APPLICATION_STATUSES.map((status) => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: selectedApplication.status === status }}
                        key={status}
                        onPress={() => updateApplicationStatus(selectedApplication.id, status)}
                        style={styles.statusOption}>
                        <ApplicationStatusBadge status={status} />
                        {selectedApplication.status === status ? (
                          <SymbolView
                            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                            tintColor={ACCENT}
                            size={15}
                          />
                        ) : null}
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="words"
        returnKeyType="next"
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.background, borderColor: theme.backgroundSelected },
        ]}
      />
    </View>
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
    color: ACCENT,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: {
    fontFamily: 'Georgia',
    lineHeight: 40,
    fontWeight: '400',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
  pressed: {
    opacity: 0.72,
  },
  summary: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  searchBox: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    marginTop: 23,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 46,
    fontSize: 13,
  },
  filters: {
    gap: 8,
    paddingVertical: 16,
    paddingRight: 24,
  },
  filter: {
    minHeight: 34,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 13,
  },
  filterText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
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
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14, 22, 17, 0.42)',
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 32 : 22,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7CEC8',
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetEyebrow: {
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 1.15,
    fontWeight: '700',
    marginBottom: 3,
  },
  sheetTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '600',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    gap: 7,
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    fontSize: 14,
  },
  formError: {
    color: '#B65345',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  submitButton: {
    minHeight: 49,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  detailRole: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  detailLocation: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  statusPrompt: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 24,
    marginBottom: 8,
  },
  statusOptions: {
    gap: 2,
    paddingBottom: 10,
  },
  statusOption: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});