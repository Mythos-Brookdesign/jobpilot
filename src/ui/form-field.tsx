import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/use-theme';

type FormFieldProps = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'autoCapitalize' | 'returnKeyType'
> & {
  label: string;
};

export function FormField({ label, autoCapitalize = 'words', ...inputProps }: FormFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="next"
        {...inputProps}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    fontSize: 14,
  },
});
