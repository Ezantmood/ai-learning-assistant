import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  PENDING_RECOVERY_EMAIL_KEY,
  RECOVERY_SENT_AT_KEY,
} from './recovery';

/**
 * FR-03: persistence luồng quên mật khẩu (email đang verify + thời điểm
 * gửi mã). Thoát app giữa chừng rồi mở lại vẫn đọc được để tiếp tục.
 */
export async function savePendingRecovery(
  email: string,
  sentAtMs: number,
): Promise<void> {
  await AsyncStorage.multiSet([
    [PENDING_RECOVERY_EMAIL_KEY, email.trim()],
    [RECOVERY_SENT_AT_KEY, String(sentAtMs)],
  ]);
}

export async function getPendingRecoveryEmail(): Promise<string | null> {
  return AsyncStorage.getItem(PENDING_RECOVERY_EMAIL_KEY);
}

export async function getRecoverySentAt(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(RECOVERY_SENT_AT_KEY);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function clearPendingRecovery(): Promise<void> {
  await AsyncStorage.multiRemove([
    PENDING_RECOVERY_EMAIL_KEY,
    RECOVERY_SENT_AT_KEY,
  ]);
}
