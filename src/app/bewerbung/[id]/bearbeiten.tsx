import { useLocalSearchParams } from 'expo-router';

import { useLive, useRepositories } from '@/db/hooks';
import { applicationToForm } from '@/domain/forms';
import { ApplicationForm } from '@/features/applications/components/application-form';
import { NotFound } from '@/features/applications/components/not-found';
import { useGoBack } from '@/ui/navigation';

export default function EditApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const application = useLive(({ applications }) => applications.get(id), ['applications'], [id]);
  const { applications } = useRepositories();
  const goBack = useGoBack({ pathname: '/bewerbung/[id]', params: { id } });

  if (!application) return <NotFound />;

  return (
    <ApplicationForm
      initialValues={applicationToForm(application)}
      submitLabel="Speichern"
      onCancel={goBack}
      onSubmit={(input) => {
        applications.update(id, input);
        goBack();
      }}
    />
  );
}
