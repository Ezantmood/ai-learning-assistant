function requireEnv(name: string, value: string | undefined) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Thiếu biến môi trường ${name}.`);
  }

  return normalizedValue;
}

function requireBooleanEnv(name: string, value: string | undefined) {
  const normalizedValue = requireEnv(name, value).toLowerCase();

  if (normalizedValue !== 'true' && normalizedValue !== 'false') {
    throw new Error(`${name} chỉ nhận giá trị true hoặc false.`);
  }

  return normalizedValue === 'true';
}

const supabaseUrl = requireEnv(
  'EXPO_PUBLIC_SUPABASE_URL',
  process.env.EXPO_PUBLIC_SUPABASE_URL,
);

try {
  new URL(supabaseUrl);
} catch {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL phải là URL hợp lệ.');
}

export const env = {
  requireEmailConfirmation: requireBooleanEnv(
    'EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION',
    process.env.EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION,
  ),
  supabasePublishableKey: requireEnv(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  supabaseUrl,
} as const;
