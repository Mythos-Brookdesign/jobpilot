import { Alert } from 'react-native';

export function confirm({
  title,
  message,
  confirmLabel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ]);
  });
}

export function notify(title: string, message: string) {
  Alert.alert(title, message);
}
