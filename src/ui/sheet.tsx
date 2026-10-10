import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/theme/use-theme';

type SheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  eyebrow: string;
  title?: string;
}>;

/** Von unten einfahrendes Panel mit Titel und Schließen-Button */
export function Sheet({ visible, onClose, eyebrow, title, children }: SheetProps) {
  const theme = useTheme();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={[styles.root, { backgroundColor: theme.overlay }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dialog schließen"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.handle, { backgroundColor: theme.sheetHandle }]} />
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>{eyebrow}</Text>
                <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>
                  {title}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Schließen"
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  tintColor={theme.text}
                  size={15}
                />
              </Pressable>
            </View>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '90%',
    alignSelf: 'center',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 32 : 22,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 1.15,
    fontWeight: '700',
    marginBottom: 3,
  },
  title: {
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
});
