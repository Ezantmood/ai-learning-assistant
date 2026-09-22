// Verify CN6: migration 0007 da apply dung tren remote chua?
// Chay bang: PROBE_EMAIL=... PROBE_PASSWORD=... node scripts/cn6-schema-verify.mjs
// (lay PROBE_* tu .env, SUPABASE_URL/ANON_KEY tu EXPO_PUBLIC_* trong .env)
// Dang nhap bang tai khoan probe (quyen authenticated, khong phai service_role
// de RLS van ap dung), roi .select() dung cac cot moi cua 0007, limit 1.
// - Bang chua ton tai: PostgREST tra PGRST205/42P01 → VERIFY_FAIL that.
// - Cot thieu (bang co nhung thieu cot): PostgREST tra loi 42703
//   (undefined_column) → VERIFY_FAIL that.
// Select tra ve [] van la DAT (bang + cot ton tai, RLS cho doc, chi la user
// nay chua co goi y nao).
// CACH DAN SQL: mo Supabase Dashboard → SQL Editor → dan TOAN BO
// supabase/migrations/0007_cn6_solutions.sql → Run (KHONG tu chay db push,
// PAT sbp_ bi RBAC chan ghi). Dan xong chay lai script nay phai VERIFY_PASS.
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

// 0. Hoi quy: bang documents + RLS doc van song sau migration.
const { error: readError } = await supabase
  .from('documents')
  .select('id')
  .limit(1);
if (readError) {
  console.log(`VERIFY_FAIL code=${readError.code ?? 'n/a'} message=${readError.message}`);
  console.log('KET LUAN: khong doc duoc documents — RLS hoac project co van de.');
  process.exit(1);
}
console.log('READ_OK (bang documents + RLS doc van song)');

const { data: rows, error } = await supabase
  .from('document_solutions')
  .select('id,document_id,user_id,solution_text,model,created_at,updated_at')
  .limit(1);

if (error) {
  console.log(`VERIFY_FAIL code=${error.code ?? 'n/a'} message=${error.message}`);
  if (error.code === '42703') {
    console.log('KET LUAN: thieu cot cua 0007 — migration chua apply dung.');
  } else if (error.code === 'PGRST205' || error.code === '42P01') {
    console.log('KET LUAN: bang document_solutions chua ton tai — migration 0007 chua apply.');
  }
  process.exit(1);
}
console.log(`VERIFY_PASS rows=${rows?.length ?? 0} (bang + cot 0007 ton tai, RLS cho doc)`);
