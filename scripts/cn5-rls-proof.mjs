// CN5 FR-37: proof Data API voi hai session A/B that.
// Chay: node --env-file=.env --env-file=.env.local scripts/cn5-rls-proof.mjs
// Service-role chi o script local; KHONG dua vao app, KHONG in key/token.
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
const clientA = createClient(url, anonKey, { auth: { persistSession: false } });
const clientB = createClient(url, anonKey, { auth: { persistSession: false } });
const suffix = randomBytes(6).toString('hex');
const password = `Cn5Proof!${randomBytes(12).toString('hex')}`;
const ids = [];
const checks = [];

function check(name, pass) {
  checks.push(pass);
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
}

async function createUser(letter) {
  const email = `cn5-proof-${letter.toLowerCase()}-${suffix}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email, email_confirm: true, password,
    user_metadata: { full_name: `CN5 Proof ${letter}`, student_code: `CN5${letter}${suffix}`.toUpperCase() },
  });
  if (error || !data.user) throw new Error(`Khong tao duoc user ${letter}: ${error?.code ?? 'unknown'}`);
  ids.push(data.user.id);
  return { email, id: data.user.id };
}

async function insertSetupRow(userId, letter) {
  const { data, error } = await admin.from('documents').insert({
    display_name: `CN5 RLS proof ${letter}`,
    extraction_status: 'done', extracted_text: `De bai ${letter}`,
    file_ext: 'jpg', file_size: 4, mime_type: 'image/jpeg',
    storage_path: `${userId}/proof-${suffix}-${letter.toLowerCase()}.jpg`,
    user_id: userId,
  }).select('id').single();
  if (error || !data) throw new Error(`Khong tao duoc row ${letter}: ${error?.code ?? 'unknown'}`);
  return data.id;
}

try {
  const userA = await createUser('A');
  const userB = await createUser('B');
  const rowA = await insertSetupRow(userA.id, 'A');
  const rowB = await insertSetupRow(userB.id, 'B');

  const signA = await clientA.auth.signInWithPassword({ email: userA.email, password });
  const signB = await clientB.auth.signInWithPassword({ email: userB.email, password });
  if (signA.error || signB.error || !signA.data.session || !signB.data.session) {
    throw new Error('SIGNIN_FAIL');
  }
  console.log(`SETUP_OK A=${userA.id.slice(0, 8)} B=${userB.id.slice(0, 8)}`);

  const ownA = await clientA.from('documents').select('id').eq('id', rowA);
  check('A SELECT row cua minh', !ownA.error && ownA.data?.length === 1);
  const crossAB = await clientA.from('documents').select('id').eq('id', rowB);
  check('A SELECT B = 0 row', !crossAB.error && crossAB.data?.length === 0);
  const crossBA = await clientB.from('documents').select('id').eq('id', rowA);
  check('B SELECT A = 0 row', !crossBA.error && crossBA.data?.length === 0);

  const insertCross = await clientA.from('documents').insert({
    display_name: 'CN5 insert cheo', extraction_status: 'pending',
    file_ext: 'jpg', file_size: 4, mime_type: 'image/jpeg',
    storage_path: `${userB.id}/proof-cross-${suffix}.jpg`, user_id: userB.id,
  });
  check('A INSERT voi user_id B bi RLS chan', insertCross.error?.code === '42501');

  const updateCross = await clientA.from('documents').update({ display_name: 'sua trom' }).eq('id', rowB).select('id');
  check('A UPDATE row B = 0 row', !updateCross.error && updateCross.data?.length === 0);
  const transfer = await clientA.from('documents').update({ user_id: userB.id }).eq('id', rowA).select('id');
  check('A UPDATE row minh sang user B bi chan', transfer.error?.code === '42501');

  const deleteCross = await clientA.from('documents').delete().eq('id', rowB).select('id');
  check('A DELETE row B = 0 row', !deleteCross.error && deleteCross.data?.length === 0);
  const ownB = await clientB.from('documents').select('id,display_name').eq('id', rowB);
  check('Row B van nguyen sau thao tac cheo', !ownB.error && ownB.data?.length === 1 && ownB.data[0].display_name === 'CN5 RLS proof B');

  console.log(checks.every(Boolean) ? `RLS_PROOF_PASS ${checks.length}/${checks.length}` : `RLS_PROOF_FAIL ${checks.filter(Boolean).length}/${checks.length}`);
  if (!checks.every(Boolean)) process.exitCode = 1;
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
