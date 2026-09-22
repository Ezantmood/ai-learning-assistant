// Verify CN5: migration 0006 da apply dung tren remote chua?
// Chay bang: PROBE_EMAIL=... PROBE_PASSWORD=... node scripts/cn5-schema-verify.mjs
// Dang nhap bang tai khoan probe (quyen authenticated, khong phai service_role
// de RLS van ap dung).
// 0006 KHONG them bang/cot moi (chi mo rong CHECK file_ext + allowed_mime_types
// bucket documents) nen khong verify kieu "thieu cot → 42703" nhu cn3/cn4.
// Thay vao do insert thu 1 row file_ext='png' that (khong tao object storage):
// - Chua apply: CHECK cu tu choi → 23514 (check_violation) = VERIFY_FAIL.
// - Da apply: insert thanh cong → xoa ngay row thu → VERIFY_PASS.
// - Insert thu file_ext='gif' phai THAT BAI 23514 (gif khong mo vi Gemini
//   khong doc); neu gif lot la migration mo thua = VERIFY_FAIL.
// Row thu chi nam o DB va duoc xoa ngay nen khong de rac, khong anh huong
// tran 100 tai lieu (xoa xong count ve cu).
// CACH DAN SQL: mo Supabase Dashboard → SQL Editor → dan TOAN BO
// supabase/migrations/0006_cn5_scan_images.sql → Run (KHONG tu chay db push,
// PAT sbp_ bi RBAC chan ghi). Danh sach MIME bucket (SQL Editor moi doc duoc,
// PostgREST khong mo storage.buckets) kiem bang mat: phai du 8 MIME, khong gif.
import { randomUUID } from 'node:crypto';

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

const uid = data.session.user.id;

// 1. Doc hoi quy: bang + RLS doc van song sau migration.
const { error: readError } = await supabase
  .from('documents')
  .select('id,file_ext')
  .limit(1);
if (readError) {
  console.log(`VERIFY_FAIL code=${readError.code ?? 'n/a'} message=${readError.message}`);
  console.log('KET LUAN: khong doc duoc documents — migration 0006 hoac RLS co van de.');
  process.exit(1);
}
console.log('READ_OK (bang documents + RLS doc van song)');

// 2. Insert thu png: da apply thi lot, chua apply thi CHECK cu chan (23514).
const pngPath = `${uid}/verify-cn5-${randomUUID()}.png`;
const { data: pngRow, error: pngError } = await supabase
  .from('documents')
  .insert({
    display_name: 'CN5 verify (xoa ngay)',
    extraction_status: 'pending',
    file_ext: 'png',
    file_size: 1,
    mime_type: 'image/png',
    storage_path: pngPath,
    user_id: uid,
  })
  .select('id')
  .single();
if (pngError) {
  console.log(`VERIFY_FAIL code=${pngError.code ?? 'n/a'} message=${pngError.message}`);
  if (pngError.code === '23514') {
    console.log('KET LUAN: whitelist file_ext chua mo png — migration 0006 chua apply dung.');
  }
  process.exit(1);
}
const { error: pngDeleteError } = await supabase
  .from('documents')
  .delete()
  .eq('id', pngRow.id)
  .select('id')
  .single();
if (pngDeleteError) {
  console.log(`VERIFY_FAIL cleanup code=${pngDeleteError.code ?? 'n/a'} message=${pngDeleteError.message}`);
  console.log(`Can xoa row thu id=${pngRow.id} thu cong truoc khi chay lai.`);
  process.exit(1);
}
console.log('PNG_OK (whitelist da mo anh, row thu da xoa)');

// 3. Insert thu gif: phai THAT BAI 23514 (gif khong mo). Lot la sai.
const gifPath = `${uid}/verify-cn5-${randomUUID()}.gif`;
const { data: gifRow, error: gifError } = await supabase
  .from('documents')
  .insert({
    display_name: 'CN5 verify gif (phai bi chan)',
    extraction_status: 'pending',
    file_ext: 'gif',
    file_size: 1,
    mime_type: 'image/gif',
    storage_path: gifPath,
    user_id: uid,
  })
  .select('id')
  .single();
if (!gifError) {
  const { error: gifDeleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', gifRow.id)
    .select('id')
    .single();
  if (gifDeleteError) {
    console.log(`VERIFY_FAIL cleanup code=${gifDeleteError.code ?? 'n/a'} message=${gifDeleteError.message}`);
    console.log(`Can xoa row thu id=${gifRow.id} thu cong.`);
    process.exit(1);
  }
  console.log('VERIFY_FAIL (gif lot whitelist — migration 0006 mo thua, phai KHONG co gif)');
  process.exit(1);
}
if (gifError.code !== '23514') {
  console.log(`VERIFY_FAIL code=${gifError.code ?? 'n/a'} message=${gifError.message}`);
  console.log('KET LUAN: gif bi chan nhung khong phai bang CHECK (sai co che chan).');
  process.exit(1);
}
console.log('GIF_OK (gif van bi CHECK chan nhu thiet ke)');
console.log('VERIFY_PASS (0006 apply dung: png lot, gif chan, RLS doc song)');
