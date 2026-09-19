import { describe, expect, it } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { TextInput } from 'react-native-paper';

import { PasswordInput } from '../PasswordInput';

describe('PasswordInput', () => {
  it('toggle đổi secureTextEntry và accessibilityLabel đúng', () => {
    let tree: ReturnType<typeof create> | undefined;
    act(() => {
      tree = create(
        <PasswordInput
          label="Mật khẩu"
          onChangeText={() => undefined}
          toggleTestID="password-toggle"
          value=""
        />,
      );
    });

    if (!tree) {
      throw new Error('Không render được PasswordInput trong test.');
    }

    const input = () => tree?.root.findByType(TextInput);
    const toggle = () => tree?.root.findByProps({ testID: 'password-toggle' });

    expect(input()?.props.secureTextEntry).toBe(true);
    expect(toggle()?.props.accessibilityLabel).toBe('Hiện mật khẩu');

    act(() => {
      toggle()?.props.onPress();
    });

    expect(input()?.props.secureTextEntry).toBe(false);
    expect(toggle()?.props.accessibilityLabel).toBe('Ẩn mật khẩu');

    act(() => {
      toggle()?.props.onPress();
    });

    expect(input()?.props.secureTextEntry).toBe(true);
    expect(toggle()?.props.accessibilityLabel).toBe('Hiện mật khẩu');
  });
});
