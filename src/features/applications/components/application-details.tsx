import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { APPLICATION_STATUSES, STATUS_LABELS, type JobApplication } from '@/domain/application';
import { useApplications } from '@/features/applications/applications-context';
import { StatusBadge } from '@/features/applications/components/status-badge';
import { useTheme } from '@/theme/use-theme';

export function ApplicationDetails({ application }: { application: JobApplication }) {
  const theme = useTheme();
  const { updateApplicationStatus } = useApplications();

  return (
    <View>
      <Text style={[styles.role, { color: theme.text }]}>{application.role}</Text>
      <Text style={[styles.location, { color: theme.textSecondary }]}>{application.location}</Text>
      <Text style={[styles.prompt, { color: theme.textSecondary }]}>Status aktualisieren</Text>
      <View style={styles.options}>
        {APPLICATION_STATUSES.map((status) => {
          const selected = application.status === status;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={STATUS_LABELS[status]}
              accessibilityState={{ selected }}
              key={status}
              onPress={() => updateApplicationStatus(application.id, status)}
              style={styles.option}>
              <StatusBadge status={status} />
              {selected ? (
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  tintColor={theme.accentText}
                  size={15}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  role: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  location: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  prompt: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 24,
    marginBottom: 8,
  },
  options: {
    gap: 2,
    paddingBottom: 10,
  },
  option: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
