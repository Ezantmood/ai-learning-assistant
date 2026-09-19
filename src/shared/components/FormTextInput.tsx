import {
  HelperText,
  TextInput,
  type TextInputProps,
} from 'react-native-paper';

type FormTextInputProps = Omit<TextInputProps, 'error' | 'left' | 'value'> & {
  fieldError?: string;
  label: string;
  /** Tên icon MaterialCommunityIcons hiển thị bên trái ô nhập. */
  leftIcon?: string;
  left?: TextInputProps['left'];
  onChangeText: (value: string) => void;
  value: string;
};

/**
 * Ô nhập liệu dùng chung cho form (G6): mode outlined, label
 * accessibility = label, lỗi validate nằm ngay dưới field.
 */
export function FormTextInput({
  fieldError,
  label,
  left,
  leftIcon,
  ...rest
}: FormTextInputProps) {
  const leftAffix = leftIcon ? (
    <TextInput.Icon forceTextInputFocus={false} icon={leftIcon} />
  ) : (
    left
  );

  return (
    <>
      <TextInput
        accessibilityLabel={rest.accessibilityLabel ?? label}
        error={Boolean(fieldError)}
        label={label}
        left={leftAffix}
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
