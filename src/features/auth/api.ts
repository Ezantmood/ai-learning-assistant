import { queryClient } from '../../shared/lib/queryClient';
import { supabase } from '../../shared/lib/supabase';
import type {
  ChangePasswordFormValues,
  SignInFormValues,
  SignUpFormValues,
} from './schemas';

export type SignUpResult = {
  needsEmailConfirmation: boolean;
};

/**
 * Đăng ký FR-01: gửi full_name + student_code vào metadata để trigger
 * handle_new_user tạo đúng một profiles row.
 */
export async function signUp(input: SignUpFormValues): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    options: {
      data: {
        full_name: input.fullName.trim(),
        student_code: input.studentCode.trim(),
      },
    },
    password: input.password,
  });

  if (error) {
    throw error;
  }

  // Supabase không ném lỗi khi email trùng (chống liệt kê user): trả về
  // user rỗng identities. Ném lỗi chuẩn để errors.ts map an toàn.
  if (
    data.user &&
    Array.isArray(data.user.identities) &&
    data.user.identities.length === 0
  ) {
    throw new Error('User already registered');
  }

  return { needsEmailConfirmation: !data.session };
}

export async function signIn(input: SignInFormValues) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Đăng xuất FR-02: xóa session + toàn bộ cache user để không còn dữ liệu cũ.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  queryClient.clear();
}

/**
 * FR-03: gửi email chứa mã OTP 6 số (template Reset password in {{ .Token }}).
 * Supabase không tiết lộ email có tồn tại hay không nên screen luôn hiện
 * thông báo trung tính khi không có lỗi.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

  if (error) {
    throw error;
  }
}

/**
 * FR-03: xác minh email + OTP, tạo recovery session để được đổi mật khẩu.
 * Không phụ thuộc deep link nên chạy trực tiếp trong Expo Go.
 */
export async function verifyRecoveryOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'recovery',
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * FR-03: đặt mật khẩu mới khi đã có recovery session từ verifyOtp.
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw error;
  }
}

/**
 * Đổi mật khẩu khi đã đăng nhập: xác thực lại bằng mật khẩu hiện tại
 * rồi mới updateUser. Mật khẩu hiện tại sai thì signIn ném lỗi.
 */
export async function changePassword(
  input: Pick<ChangePasswordFormValues, 'currentPassword' | 'newPassword'>,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email;

  if (!email) {
    throw new Error('Auth session missing');
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: input.currentPassword,
  });

  if (signInError) {
    throw signInError;
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.newPassword,
  });

  if (updateError) {
    throw updateError;
  }
}
