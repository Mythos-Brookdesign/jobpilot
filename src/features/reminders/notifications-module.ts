import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

// Expo Go auf Android bricht seit SDK 53 schon beim Import von expo-notifications ab
// (Push wurde dort entfernt). Dort wird das Modul deshalb gar nicht erst geladen;
// Erinnerungen erscheinen dann wie im Browser nur in der App.

type NotificationsModule = typeof import('expo-notifications');

export const Notifications: NotificationsModule | null =
  Platform.OS === 'android' && isRunningInExpoGo()
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('expo-notifications');
