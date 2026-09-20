// Verify CN4: migration 0005 da apply dung tren remote chua?
// Chay bang: PROBE_EMAIL=... PROBE_PASSWORD=... node scripts/cn4-schema-verify.mjs
// Dang nhap bang tai khoan probe (quyen authenticated, khong phai service_role
// de RLS van ap dung), roi .select() dung cac cot moi cua 0005, limit 1.
// Cot thieu thi PostgREST tra loi 42703 (undefined_column) — do la cach
// verify fail duoc that. Select tra ve [] van la DAT (bang + cot ton tai,
// RLS cho doc, chi la user nay chua hoi cau nao).
// CACH DAN SQL: mo Supabase Dashboard → SQL Editor → dan TOAN BO
// supabase/migrations/0005_cn4_questions.sql → Run (KHONG tu chay db push).
import { createClient } from '@supabase/supabase-js';

const email = process.env.PROBE_EMAIL?.trim() ?? '';
const password = process.env.PROBE_PASSWORD?.trim() ?? '';
if (!email || !password) {
  console.error(
    'THIEU CREDENTIAL: dat PROBE_EMAIL va PROBE_PASSWORD trong env roi chay lai.',
  );
  process.exit(2);
}

const supabaseUrl = (
  process.env.SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  ''
).trim();
const publishableKey = (
  process.env.SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  ''
).trim();
if (!supabaseUrl || !publishableKey) {
  console.error('THIEU ENV: can SUPABASE_URL va SUPABASE_ANON_KEY (hoac EXPO_PUBLIC_*).');
  process.exit(2);
}

const supabase = createClient(supabaseUrl, publishableKey);
const { data, error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (signInError || !data.session) {
  console.error(`SIGNIN_FAIL body=${signInError?.message ?? 'khong co session'}`);
  process.exit(1);
}
console.log('SIGNIN_OK');

const { data: rows, error } = await supabase
  .from('document_questions')
  .select('id,document_id,user_id,question,answer,model,created_at,updated_at')
  .limit(1);

if (error) {
  console.log(`VERIFY_FAIL code=${error.code ?? 'n/a'} message=${error.message}`);
  if (error.code === '42703') {
    console.log('KET LUAN: thieu cot cua 0005 — migration chua apply dung.');
  }
  process.exit(1);
}
console.log(`VERIFY_PASS rows=${rows?.length ?? 0} (bang + cot 0005 ton tai, RLS cho doc)`);
