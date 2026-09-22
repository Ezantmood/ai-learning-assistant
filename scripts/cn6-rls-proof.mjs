// CN6 FR-44: proof Data API bang hai session A/B that.
// node --env-file=.env --env-file=.env.local scripts/cn6-rls-proof.mjs
// Service-role chi dung local, khong in key/token.
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error('THIEU ENV: URL, publishable key hoac service-role key.');
  process.exit(2);
}
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const a = createClient(url, anonKey, { auth: { persistSession: false } });
const b = createClient(url, anonKey, { auth: { persistSession: false } });
const suffix = randomBytes(6).toString('hex');
const password = `Cn6Proof!${randomBytes(12).toString('hex')}`;
const ids = [];
const checks = [];
function check(name, pass) {
  checks.push(pass);
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
}
async function user(letter) {
  const email = `cn6-proof-${letter.toLowerCase()}-${suffix}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email, email_confirm: true, password,
    user_metadata: { full_name: `CN6 Proof ${letter}`, student_code: `CN6${letter}${suffix}`.toUpperCase() },
  });
  if (error || !data.user) throw new Error(`CREATE_USER_${letter}: ${error?.code ?? 'unknown'}`);
  ids.push(data.user.id);
  return { email, id: data.user.id };
}
async function document(userId, letter) {
  const { data, error } = await admin.from('documents').insert({
    display_name: `CN6 proof ${letter}`, extraction_status: 'done',
    extracted_text: `De bai ${letter}`, file_ext: 'txt', file_size: 4,
    mime_type: 'text/plain', storage_path: `${userId}/cn6-proof-${suffix}-${letter}.txt`,
    user_id: userId,
  }).select('id').single();
  if (error || !data) throw new Error(`CREATE_DOCUMENT_${letter}: ${error?.code ?? 'unknown'}`);
  return data.id;
}

try {
  const ua = await user('A');
  const ub = await user('B');
  const da = await document(ua.id, 'A');
  const db = await document(ub.id, 'B');
  const [sa, sb] = await Promise.all([
    a.auth.signInWithPassword({ email: ua.email, password }),
    b.auth.signInWithPassword({ email: ub.email, password }),
  ]);
  if (sa.error || sb.error || !sa.data.session || !sb.data.session) throw new Error('SIGNIN_FAIL');
  console.log('SETUP_OK');

  const ownA = await a.from('document_solutions').insert({ document_id: da, user_id: ua.id, solution_text: 'Loi giai A' }).select('id').single();
  const ownB = await b.from('document_solutions').insert({ document_id: db, user_id: ub.id, solution_text: 'Loi giai B' }).select('id').single();
  check('A/B INSERT row cua minh', !ownA.error && !ownB.error && Boolean(ownA.data && ownB.data));
  if (!ownA.data || !ownB.data) throw new Error('OWN_INSERT_FAIL');

  const selectOwn = await a.from('document_solutions').select('id').eq('id', ownA.data.id);
  const selectCross = await a.from('document_solutions').select('id').eq('id', ownB.data.id);
  const selectCrossB = await b.from('document_solutions').select('id').eq('id', ownA.data.id);
  check('A SELECT row cua minh', !selectOwn.error && selectOwn.data?.length === 1);
  check('A SELECT B = 0 row', !selectCross.error && selectCross.data?.length === 0);
  check('B SELECT A = 0 row', !selectCrossB.error && selectCrossB.data?.length === 0);

  const insertCross = await a.from('document_solutions').insert({ document_id: db, user_id: ub.id, solution_text: 'Chen cheo' });
  check('A INSERT user_id B bi RLS chan', insertCross.error?.code === '42501');
  const updateCross = await a.from('document_solutions').update({ solution_text: 'Sua trom' }).eq('id', ownB.data.id).select('id');
  check('A UPDATE B = 0 row', !updateCross.error && updateCross.data?.length === 0);
  const transfer = await a.from('document_solutions').update({ user_id: ub.id }).eq('id', ownA.data.id).select('id');
  check('A UPDATE row minh sang B bi chan', transfer.error?.code === '42501');
  const deleteCross = await a.from('document_solutions').delete().eq('id', ownB.data.id).select('id');
  check('A DELETE B = 0 row', !deleteCross.error && deleteCross.data?.length === 0);
  const stillB = await b.from('document_solutions').select('solution_text').eq('id', ownB.data.id).single();
  check('Row B khong bi thay doi', !stillB.error && stillB.data?.solution_text === 'Loi giai B');
  const ownUpdate = await a.from('document_solutions').update({ solution_text: 'Loi giai A moi' }).eq('id', ownA.data.id).select('solution_text').single();
  check('A UPDATE row cua minh', !ownUpdate.error && ownUpdate.data?.solution_text === 'Loi giai A moi');
  const ownDelete = await a.from('document_solutions').delete().eq('id', ownA.data.id).select('id');
  check('A DELETE row cua minh', !ownDelete.error && ownDelete.data?.length === 1);

  const pass = checks.every(Boolean);
  console.log(`${pass ? 'RLS_PROOF_PASS' : 'RLS_PROOF_FAIL'} ${checks.filter(Boolean).length}/${checks.length}`);
  if (!pass) process.exitCode = 1;
} catch (error) {
  console.error(`RLS_PROOF_ERROR ${error instanceof Error ? error.message : 'unknown'}`);
  process.exitCode = 1;
} finally {
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      console.error(`CLEANUP_FAIL user=${id.slice(0, 8)} code=${error.code ?? 'unknown'}`);
      process.exitCode = 1;
    }
  }
}
