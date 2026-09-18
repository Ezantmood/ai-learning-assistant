import { describe, expect, it, jest } from '@jest/globals';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Avatar, Button, Text } from 'react-native-paper';

import { ProfileView } from '../ProfileView';

const SAFE_METRICS = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 0, left: 0, right: 0, top: 0 },
};

function renderView(
  props: Partial<Parameters<typeof ProfileView>[0]> = {},
): ReactTestRenderer {
  const noop = () => undefined;
  let tree: ReactTestRenderer | undefined;

  act(() => {
    tree = create(
      <SafeAreaProvider initialMetrics={SAFE_METRICS}>
        <ProfileView
        avatarUrl={null}
        email="a@example.com"
        fullName="Nguyen Van A"
        notice={null}
        onDismissNotice={noop}
        onPickAvatar={noop}
        onRetry={noop}
        onSave={noop}
        saving={false}
        status="ready"
        studentCode="SV001"
        uploading={false}
        {...props}
        />
      </SafeAreaProvider>,
    );
  });

  if (!tree) {
    throw new Error('Không render được ProfileView trong test.');
  }
  return tree;
}

function textsOf(tree: ReactTestRenderer): string[] {
  return tree.root.findAllByType(Text).map((node) => {
    const children = node.props.children;
    return Array.isArray(children) ? children.join('') : String(children ?? '');
  });
}

describe('ProfileView', () => {
  it('trạng thái loading: hiện spinner và chữ tải hồ sơ', () => {
    const tree = renderView({ status: 'loading' });
    expect(textsOf(tree)).toContain('Đang tải hồ sơ…');
  });

  it('trạng thái error: hiện thông báo và nút thử lại gọi onRetry', () => {
    const onRetry = jest.fn();
    const tree = renderView({ onRetry, status: 'error' });

    expect(textsOf(tree)).toContain('Không tải được hồ sơ.');

    const retryButton = tree.root.findByProps({
      accessibilityLabel: 'Tải lại hồ sơ',
    });
    expect(retryButton.type).toBe(Button);
    act(() => {
      retryButton.props.onPress();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('trạng thái ready: hiện email, nút lưu và avatar fallback chữ cái đầu', () => {
    const tree = renderView({});

    expect(textsOf(tree)).toContain('a@example.com');
    expect(
      tree.root.findByProps({ accessibilityLabel: 'Lưu hồ sơ' }),
    ).toBeTruthy();

    const fallback = tree.root.findByType(Avatar.Text);
    expect(fallback.props.label).toBe('N');
  });

  it('có avatarUrl: render ảnh thay vì fallback', () => {
    const tree = renderView({ avatarUrl: 'https://example.com/a.jpg' });

    const image = tree.root.findByType(Avatar.Image);
    expect(image.props.source).toEqual({ uri: 'https://example.com/a.jpg' });
    expect(tree.root.findAllByType(Avatar.Text)).toHaveLength(0);
  });
});
