import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ExportFile = { name: string; content: string; mimeType: string };

/** Legt die Datei im Cache ab und öffnet das Teilen-Menü (Dateien, Mail, AirDrop …) */
export async function shareFile({ name, content, mimeType }: ExportFile) {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}

/** Text einer vom Nutzer gewählten Datei, oder null bei Abbruch */
export async function pickTextFile(mimeTypes: string[]): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: mimeTypes,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  return new File(result.assets[0].uri).text();
}
