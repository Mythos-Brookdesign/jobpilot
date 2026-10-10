import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SymbolViewProps } from 'expo-symbols';

import { useRepositories } from '@/db/hooks';
import { STATUS_LABELS } from '@/domain/application';
import {
  APPOINTMENT_KIND_LABELS,
  formatAppointmentTime,
  type Appointment,
  type AppointmentKind,
  type Contact,
  type Note,
} from '@/domain/details';
import type { TimelineItem } from '@/domain/timeline';
import { useTheme } from '@/theme/use-theme';
import { Button } from '@/ui/button';
import { confirm } from '@/ui/dialogs';
import { FormField } from '@/ui/form-field';
import { ListRow } from '@/ui/list-row';
import { Section } from '@/ui/section';

const KIND_ICONS: Record<AppointmentKind, SymbolViewProps['name']> = {
  phone: { ios: 'phone', android: 'call', web: 'call' },
  video: { ios: 'video', android: 'videocam', web: 'videocam' },
  onsite: { ios: 'building.2', android: 'apartment', web: 'apartment' },
  technical: {
    ios: 'chevron.left.forwardslash.chevron.right',
    android: 'code',
    web: 'code',
  },
};

const PLUS: SymbolViewProps['name'] = { ios: 'plus', android: 'add', web: 'add' };

function EmptyHint({ text }: { text: string }) {
  const theme = useTheme();
  return <Text style={[styles.empty, { color: theme.textSecondary }]}>{text}</Text>;
}

// --- Termine ---------------------------------------------------------------------------------

export function AppointmentsSection({
  applicationId,
  appointments,
}: {
  applicationId: string;
  appointments: Appointment[];
}) {
  const router = useRouter();
  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.startsAt) >= now);

  const open = (terminId?: string) =>
    router.push({
      pathname: '/bewerbung/[id]/termin',
      params: terminId ? { id: applicationId, terminId } : { id: applicationId },
    });

  return (
    <Section
      title="Anstehende Termine"
      action={
        <Button label="Termin" icon={PLUS} variant="secondary" compact onPress={() => open()} />
      }>
      {upcoming.length === 0 ? (
        <EmptyHint text="Noch kein Termin geplant." />
      ) : (
        upcoming.map((appointment, index) => (
          <ListRow
            key={appointment.id}
            first={index === 0}
            icon={KIND_ICONS[appointment.kind]}
            highlight
            title={formatAppointmentTime(appointment.startsAt, now)}
            subtitle={[APPOINTMENT_KIND_LABELS[appointment.kind], appointment.location]
              .filter(Boolean)
              .join(' · ')}
            accessibilityHint="Termin bearbeiten"
            onPress={() => open(appointment.id)}
          />
        ))
      )}
    </Section>
  );
}

// --- Kontakte --------------------------------------------------------------------------------

export function ContactsSection({
  applicationId,
  contacts,
}: {
  applicationId: string;
  contacts: Contact[];
}) {
  const router = useRouter();
  const theme = useTheme();

  const open = (kontaktId?: string) =>
    router.push({
      pathname: '/bewerbung/[id]/kontakt',
      params: kontaktId ? { id: applicationId, kontaktId } : { id: applicationId },
    });

  return (
    <Section
      title="Kontakte"
      action={
        <Button label="Kontakt" icon={PLUS} variant="secondary" compact onPress={() => open()} />
      }>
      {contacts.length === 0 ? (
        <EmptyHint text="Wer ist dein Ansprechpartner? Halte Namen und Kontaktdaten hier fest." />
      ) : (
        contacts.map((contact, index) => {
          const actions: { label: string; url: string }[] = [];
          if (contact.email) actions.push({ label: 'E-Mail', url: `mailto:${contact.email}` });
          if (contact.phone)
            actions.push({ label: 'Anrufen', url: `tel:${contact.phone.replace(/\s/g, '')}` });
          if (contact.linkedinUrl) actions.push({ label: 'LinkedIn', url: contact.linkedinUrl });

          return (
            <ListRow
              key={contact.id}
              first={index === 0}
              icon={{ ios: 'person', android: 'person', web: 'person' }}
              title={contact.name}
              subtitle={contact.role}
              accessibilityHint="Kontakt bearbeiten"
              onPress={() => open(contact.id)}
              trailing={
                <View style={styles.contactActions}>
                  {actions.map((action) => (
                    <Pressable
                      key={action.label}
                      accessibilityRole="link"
                      accessibilityLabel={`${action.label}: ${contact.name}`}
                      hitSlop={6}
                      onPress={() => Linking.openURL(action.url)}
                      style={[styles.contactAction, { borderColor: theme.backgroundSelected }]}>
                      <Text style={[styles.contactActionText, { color: theme.accentText }]}>
                        {action.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              }
            />
          );
        })
      )}
    </Section>
  );
}

// --- Notizen ---------------------------------------------------------------------------------

export function NotesSection({ applicationId, notes }: { applicationId: string; notes: Note[] }) {
  const theme = useTheme();
  const { details } = useRepositories();
  const [draft, setDraft] = useState('');

  function add() {
    if (!draft.trim()) return;
    details.addNote(applicationId, draft);
    setDraft('');
  }

  async function remove(note: Note) {
    const confirmed = await confirm({
      title: 'Notiz löschen?',
      message: note.body.slice(0, 120),
      confirmLabel: 'Löschen',
    });
    if (confirmed) details.deleteNote(note.id);
  }

  return (
    <Section title="Notizen" plain>
      <FormField
        label="Neue Notiz"
        value={draft}
        onChangeText={setDraft}
        placeholder="Eindrücke aus dem Gespräch, offene Fragen, Gehaltsvorstellung …"
        multiline
      />
      <View style={styles.noteButton}>
        <Button
          label="Notiz speichern"
          variant="secondary"
          compact
          disabled={!draft.trim()}
          onPress={add}
        />
      </View>
      {notes.map((note) => (
        <View
          key={note.id}
          style={[
            styles.note,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}>
          <Text selectable style={[styles.noteBody, { color: theme.text }]}>
            {note.body}
          </Text>
          <View style={styles.noteFooter}>
            <Text style={[styles.noteDate, { color: theme.textSecondary }]}>
              {new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(
                new Date(note.createdAt),
              )}
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => remove(note)}>
              <Text style={[styles.noteDelete, { color: theme.danger }]}>Löschen</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </Section>
  );
}

// --- Verlauf ---------------------------------------------------------------------------------

export function TimelineSection({ items }: { items: TimelineItem[] }) {
  const theme = useTheme();
  const format = (at: string) =>
    new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(at),
    );

  function describe(item: TimelineItem) {
    switch (item.kind) {
      case 'status':
        return item.event.from
          ? `Status: ${STATUS_LABELS[item.event.from]} → ${STATUS_LABELS[item.event.to]}`
          : `Angelegt als „${STATUS_LABELS[item.event.to]}“`;
      case 'note':
        return `Notiz: ${item.note.body.split('\n')[0]}`;
      case 'appointment':
        return `${item.upcoming ? 'Geplant' : 'Termin'}: ${APPOINTMENT_KIND_LABELS[item.appointment.kind]}`;
    }
  }

  return (
    <Section title="Verlauf" plain>
      <View accessibilityRole="list">
        {items.map((item, index) => (
          <View key={`${item.kind}-${item.at}-${index}`} style={styles.timelineItem}>
            <View style={styles.timelineRail}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor:
                      item.kind === 'status' ? theme.accentText : theme.backgroundSelected,
                    borderColor: theme.accentText,
                  },
                ]}
              />
              {index < items.length - 1 ? (
                <View
                  style={[styles.timelineLine, { backgroundColor: theme.backgroundSelected }]}
                />
              ) : null}
            </View>
            <View style={styles.timelineCopy}>
              <Text numberOfLines={2} style={[styles.timelineText, { color: theme.text }]}>
                {describe(item)}
              </Text>
              <Text style={[styles.timelineDate, { color: theme.textSecondary }]}>
                {format(item.at)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 19,
    padding: 15,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 6,
  },
  contactAction: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  contactActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noteButton: {
    alignItems: 'flex-end',
    marginTop: -6,
    marginBottom: 12,
  },
  note: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 8,
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 11,
  },
  noteDelete: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineRail: {
    width: 12,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginTop: 5,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginVertical: 3,
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timelineDate: {
    fontSize: 12,
    marginTop: 2,
  },
});
