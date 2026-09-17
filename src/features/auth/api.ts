import { queryClient } from '../../lib/queryClient';
import { supabase } from '../../lib/supabase';
import type { SignInFormValues, SignUpFormValues } from './schemas';

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
