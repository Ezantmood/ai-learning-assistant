import { describe, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { PaperProvider, Text } from 'react-native-paper';

import { lightTheme } from '../../theme/theme';
import { ScreenHeader } from '../ScreenHeader';

function renderHeader(props: {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}) {
  let tree: ReturnType<typeof create> | undefined;
  act(() => {
    tree = create(
      <PaperProvider theme={lightTheme}>
        <ScreenHeader {...props} />
      </PaperProvider>,
    );
  });

  if (!tree) {
    throw new Error('Không render được ScreenHeader trong test.');
  }
  return tree;
}

function textsOf(tree: ReturnType<typeof create>): string[] {
  return tree.root.findAllByType(Text).map((node) => {
    const children = node.props.children;
    return Array.isArray(children) ? children.join('') : String(children ?? '');
  });
}

describe('ScreenHeader', () => {
  it('render đúng title Profile và nút back gọi onBack', () => {
    const onBack = jest.fn();
    const tree = renderHeader({
      onBack,
      showBack: true,
      title: 'Thông tin cá nhân',
    });

    expect(textsOf(tree)).toContain('Thông tin cá nhân');

    const backButton = tree.root.findByProps({
      accessibilityLabel: 'Quay lại',
    });
    act(() => {
      backButton.props.onPress();
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('không có showBack thì không render nút back', () => {
    const tree = renderHeader({ title: 'Ghi chú mới' });

    expect(textsOf(tree)).toContain('Ghi chú mới');
    expect(
      tree.root.findAllByProps({ accessibilityLabel: 'Quay lại' }),
    ).toHaveLength(0);
  });
});
