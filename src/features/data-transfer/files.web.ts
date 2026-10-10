import * as DocumentPicker from 'expo-document-picker';

export type ExportFile = { name: string; content: string; mimeType: string };

/** Im Browser: als Download speichern */
export async function shareFile({ name, content, mimeType }: ExportFile) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export async function pickTextFile(mimeTypes: string[]): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: mimeTypes });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return asset.file ? asset.file.text() : (await fetch(asset.uri)).text();
}
