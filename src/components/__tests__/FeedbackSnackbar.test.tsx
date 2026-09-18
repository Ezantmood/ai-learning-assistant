import { describe, expect, it } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { Icon, PaperProvider, Snackbar } from 'react-native-paper';

import { lightTheme } from '../../theme/theme';
import {
  FeedbackSnackbar,
  type FeedbackVariant,
} from '../FeedbackSnackbar';

const EXPECTED_ICON: Record<FeedbackVariant, string> = {
  error: 'alert-circle',
  info: 'information',
  success: 'check-circle',
};

function renderSnackbar(variant: FeedbackVariant) {
  let tree: ReturnType<typeof create> | undefined;
  act(() => {
    tree = create(
      <PaperProvider theme={lightTheme}>
        <FeedbackSnackbar
          message="Thông báo kiểm thử"
          onDismiss={() => undefined}
          variant={variant}
          visible
        />
      </PaperProvider>,
    );
  });

  if (!tree) {
    throw new Error('Không render được FeedbackSnackbar trong test.');
  }
  return tree;
}

describe('FeedbackSnackbar', () => {
  it.each(['success', 'error', 'info'] as const)(
    'variant %s render đúng leading icon',
    (variant) => {
      const tree = renderSnackbar(variant);

      const icon = tree.root.findByProps({
        testID: `feedback-icon-${variant}`,
      });
      expect(icon.type).toBe(Icon);
      expect(icon.props.source).toBe(EXPECTED_ICON[variant]);
    },
  );

  it('có nút đóng qua icon close + onIconPress', () => {
    const tree = renderSnackbar('info');

    const snackbar = tree.root.findByType(Snackbar);
    expect(snackbar.props.icon).toBe('close');
    expect(typeof snackbar.props.onIconPress).toBe('function');
  });
});
