// Alert.alert aus React Native tut im Browser nichts – hier die Browser-Dialoge

export async function confirm({
  title,
  message,
}: {
  title: string;
  message: string;
  confirmLabel: string;
}): Promise<boolean> {
  return window.confirm(`${title}\n\n${message}`);
}

export function notify(title: string, message: string) {
  window.alert(`${title}\n\n${message}`);
}
