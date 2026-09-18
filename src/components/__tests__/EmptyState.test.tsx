import { describe, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { Button, PaperProvider, Text } from 'react-native-paper';

import { lightTheme } from '../../theme/theme';
import { EmptyState } from '../EmptyState';

function textsOf(tree: ReturnType<typeof create>): string[] {
  return tree.root.findAllByType(Text).map((node) => {
    const children = node.props.children;
    return Array.isArray(children) ? children.join('') : String(children ?? '');
  });
}

describe('EmptyState', () => {
  it('render icon, tiêu đề, mô tả và nút action gọi onAction', () => {
    const onAction = jest.fn();
    let tree: ReturnType<typeof create> | undefined;
    act(() => {
      tree = create(
        <PaperProvider theme={lightTheme}>
          <EmptyState
            actionLabel="Tạo ghi chú"
            actionTestID="notes-empty-create"
            description="Mô tả kiểm thử"
            icon="notebook-outline"
            onAction={onAction}
            title="Chưa có ghi chú nào"
          />
        </PaperProvider>,
      );
    });

    if (!tree) {
      throw new Error('Không render được EmptyState trong test.');
    }

    expect(textsOf(tree)).toContain('Chưa có ghi chú nào');
    expect(textsOf(tree)).toContain('Mô tả kiểm thử');

    const action = tree.root.findByProps({ testID: 'notes-empty-create' });
    expect(action.type).toBe(Button);
    act(() => {
      action.props.onPress();
    });
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('không có onAction thì không render nút', () => {
    let tree: ReturnType<typeof create> | undefined;
    act(() => {
      tree = create(
        <PaperProvider theme={lightTheme}>
          <EmptyState icon="notebook-outline" title="Trống" />
        </PaperProvider>,
      );
    });

    if (!tree) {
      throw new Error('Không render được EmptyState trong test.');
    }

    expect(textsOf(tree)).toContain('Trống');
    expect(tree.root.findAllByType(Button)).toHaveLength(0);
  });
});
