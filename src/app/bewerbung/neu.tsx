import { useRouter } from 'expo-router';

import { useRepositories } from '@/db/hooks';
import { toLocalIsoDate } from '@/domain/application';
import { emptyApplicationForm } from '@/domain/forms';
import { ApplicationForm } from '@/features/applications/components/application-form';
import { useGoBack } from '@/ui/navigation';

export default function NewApplicationScreen() {
  const router = useRouter();
  const { applications } = useRepositories();
  const goBack = useGoBack('/bewerbungen');

  return (
    <ApplicationForm
      initialValues={emptyApplicationForm(toLocalIsoDate(new Date()))}
      submitLabel="Speichern"
      onCancel={goBack}
      onSubmit={(input) => {
        const { id } = applications.create(input);
        // Statt zurück direkt zur neuen Bewerbung, damit man Kontakte und Termine ergänzen kann
        router.replace({ pathname: '/bewerbung/[id]', params: { id } });
      }}
    />
  );
}
