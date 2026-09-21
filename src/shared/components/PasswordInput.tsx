import { useState } from 'react';
import { TextInput } from 'react-native-paper';

import { FormTextInput } from './FormTextInput';
import { AppIcons } from '../theme/icons';

type PasswordInputProps = Omit<
  React.ComponentProps<typeof FormTextInput>,
  'leftIcon' | 'right' | 'secureTextEntry'
> & {
  /** testID ổn định cho nút hiện/ẩn mật khẩu. */
  toggleTestID?: string;
};

/**
 * Ô mật khẩu G6: icon `eye`/`eye-off` để toggle secureTextEntry,
 * accessibilityLabel động, không nhảy focus khi bấm icon.
 */
export function PasswordInput({
  toggleTestID = 'password-toggle',
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FormTextInput
      leftIcon={AppIcons.lockOutline}
      secureTextEntry={!visible}
      {...rest}
      right={
        <TextInput.Icon
          accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          forceTextInputFocus={false}
          icon={visible ? AppIcons.eyeOff : AppIcons.eye}
          onPress={() => setVisible((prev) => !prev)}
          testID={toggleTestID}
        />
      }
    />
  );
}
