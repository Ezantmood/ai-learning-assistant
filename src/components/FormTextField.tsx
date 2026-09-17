import {
  HelperText,
  TextInput,
  type TextInputProps,
} from 'react-native-paper';

type FormTextFieldProps = Omit<TextInputProps, 'error' | 'value'> & {
  fieldError?: string;
  label: string;
  onChangeText: (value: string) => void;
  value: string;
};

/**
 * Ô nhập liệu dùng chung cho form (G3): label accessibility = label,
 * lỗi validate nằm ngay dưới field.
 */
export function FormTextField({
  fieldError,
  label,
  ...rest
}: FormTextFieldProps) {
  return (
    <>
      <TextInput
        accessibilityLabel={rest.accessibilityLabel ?? label}
        error={Boolean(fieldError)}
        label={label}
        mode="outlined"
        {...rest}
      />
      {fieldError ? (
        <HelperText type="error" visible>
          {fieldError}
        </HelperText>
      ) : null}
    </>
  );
}
