// node --env-file=.env --env-file=.env.local scripts/fr-audit-proof.mjs
// Chi tao/don du lieu test; service-role KHONG vao app, khong in credentials.
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const e = process.env;
if (!e.EXPO_PUBLIC_SUPABASE_URL || !e.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !e.SUPABASE_SERVICE_ROLE_KEY) throw Error('MISSING_PROOF_ENV');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(e.EXPO_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, options);
const a = createClient(e.EXPO_PUBLIC_SUPABASE_URL, e.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const b = createClient(e.EXPO_PUBLIC_SUPABASE_URL, e.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const anon = createClient(e.EXPO_PUBLIC_SUPABASE_URL, e.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const users = [], paths = [], checks = [];
function check(name, pass) { checks.push(Boolean(pass)); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); }
function required(result, label) { if (result.error || !result.data) throw Error(`${label}: ${result.error?.code ?? 'empty'}`); return result.data; }
async function makeUser(client, label) {
  const suffix = randomUUID().slice(0, 8), email = `fr-proof-${suffix}@example.com`, password = `Audit!${randomUUID()}`;
  const data = required(await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `FR Proof ${label}`, student_code: `FR${label}${suffix}` } }), 'CREATE_USER');
  users.push(data.user.id);
  required(await client.auth.signInWithPassword({ email, password }), 'SIGNIN');
  return data.user.id;
}
async function makeDocument(client, userId, subjectId = null) {
  return required(await client.from('documents').insert({ user_id: userId, subject_id: subjectId, display_name: 'FR audit fixture', file_ext: 'txt', file_size: 4, mime_type: 'text/plain', storage_path: `${userId}/${randomUUID()}.txt` }).select('*').single(), 'CREATE_DOCUMENT');
}
try {
  const ua = await makeUser(a, 'A'), ub = await makeUser(b, 'B');
  const sa = required(await a.from('subjects').insert({ user_id: ua, name: 'Audit A' }).select('*').single(), 'SUBJECT_A');
  const sb = required(await b.from('subjects').insert({ user_id: ub, name: 'Audit B' }).select('*').single(), 'SUBJECT_B');
  const da = await makeDocument(a, ua, sa.id), db = await makeDocument(b, ub, sb.id), dbProbe = await makeDocument(b, ub);
  for (const [table, own, other] of [['subjects', sa, sb], ['documents', da, db]]) {
    check(`${table} read own`, required(await a.from(table).select('id').eq('id', own.id), 'SELECT_OWN').length === 1);
    const cross = await a.from(table).select('id').eq('id', other.id);
    check(`${table} read B denied`, !cross.error && cross.data.length === 0);
    const update = await a.from(table).update(table === 'subjects' ? { name: 'Intrusion' } : { display_name: 'Intrusion' }).eq('id', other.id).select('id');
    check(`${table} update B denied`, !update.error && update.data.length === 0);
    const del = await a.from(table).delete().eq('id', other.id).select('id');
    check(`${table} delete B denied`, !del.error && del.data.length === 0);
    const transfer = await a.from(table).update({ user_id: ub }).eq('id', own.id);
    check(`${table} transfer owner denied`, transfer.error?.code === '42501');
  }
  const wrongSubject = await a.from('documents').update({ subject_id: sb.id }).eq('id', da.id);
  check('documents own user + foreign subject denied', wrongSubject.error?.code === '42501');
  if (!wrongSubject.error) await a.from('documents').update({ subject_id: sa.id }).eq('id', da.id);
  const wrongPath = await a.from('documents').update({ storage_path: `${ub}/${randomUUID()}.txt` }).eq('id', da.id);
  check('documents foreign storage folder denied', wrongPath.error?.code === '42501');
  if (!wrongPath.error) await a.from('documents').update({ storage_path: da.storage_path }).eq('id', da.id);

  for (const [table, body] of [['document_summaries', { summary_text: 'Summary' }], ['document_questions', { question: 'Question?', answer: 'Answer', conversation_id: randomUUID() }], ['document_solutions', { solution_text: 'Hint', response_type: 'hint', hint_step: 1 }]]) {
    const own = required(await a.from(table).insert({ document_id: da.id, user_id: ua, ...body }).select('*').single(), `${table}_A`);
    const other = required(await b.from(table).insert({ document_id: db.id, user_id: ub, ...body }).select('*').single(), `${table}_B`);
    check(`${table} A/B insert own`, Boolean(own.id && other.id));
    const cross = await a.from(table).select('id').eq('id', other.id);
    check(`${table} read B denied`, !cross.error && cross.data.length === 0);
    const insertCross = await a.from(table).insert({ document_id: dbProbe.id, user_id: ub, ...body });
    check(`${table} forged user denied`, insertCross.error?.code === '42501');
    const parentCross = await a.from(table).insert({ document_id: dbProbe.id, user_id: ua, ...body });
    check(`${table} own user + foreign document denied`, parentCross.error?.code === '42501');
    const update = await a.from(table).update(body).eq('id', other.id).select('id');
    check(`${table} update B denied`, !update.error && update.data.length === 0);
    const reparent = await a.from(table).update({ document_id: dbProbe.id }).eq('id', own.id);
    check(`${table} reparent to B denied`, reparent.error?.code === '42501');
    if (!reparent.error) await a.from(table).update({ document_id: da.id }).eq('id', own.id);
    const del = await a.from(table).delete().eq('id', other.id).select('id');
    check(`${table} delete B denied`, !del.error && del.data.length === 0);
    const ownUpdate = await a.from(table).update(body).eq('id', own.id).select('id');
    check(`${table} update own`, !ownUpdate.error && ownUpdate.data.length === 1);
    const ownDelete = await a.from(table).delete().eq('id', own.id).select('id');
    check(`${table} delete own`, !ownDelete.error && ownDelete.data.length === 1);
    const publicRead = await anon.from(table).select('id');
    check(`${table} anon denied`, Boolean(publicRead.error) || publicRead.data?.length === 0);
  }
  const versions = required(await a.from('document_summaries').insert(['short', 'detailed'].map(level => ({ document_id: da.id, user_id: ua, summary_text: 'Version', summary_level: level, summary_scope: 'sections', section_title: 'Chương 1' }))).select('id'), 'VERSIONS');
  check('summary multiple versions retained', versions.length === 2);
  const pathA = `${ua}/${randomUUID()}.txt`, pathB = `${ub}/${randomUUID()}.txt`;
  paths.push(pathA, pathB);
  const uploadA = await a.storage.from('documents').upload(pathA, Buffer.from('test'), { contentType: 'text/plain' });
  const uploadB = await b.storage.from('documents').upload(pathB, Buffer.from('test'), { contentType: 'text/plain' });
  check('Storage A/B upload own', !uploadA.error && !uploadB.error);
  check('Storage read B denied', Boolean((await a.storage.from('documents').download(pathB)).error));
  check('Storage signed URL B denied', Boolean((await a.storage.from('documents').createSignedUrl(pathB, 60)).error));
  const crossPath = `${ub}/${randomUUID()}.txt`; paths.push(crossPath);
  check('Storage upload B denied', Boolean((await a.storage.from('documents').upload(crossPath, Buffer.from('no'), { contentType: 'text/plain' })).error));
  await a.storage.from('documents').remove([pathB]);
  check('Storage delete B denied (B still reads)', !(await b.storage.from('documents').download(pathB)).error);
  check('Storage anon read denied', Boolean((await anon.storage.from('documents').download(pathA)).error));
  const deletedSubject = await a.from('subjects').delete().eq('id', sa.id);
  const preservedDocument = await a.from('documents').select('subject_id').eq('id', da.id).single();
  check('delete subject preserves document/set null', !deletedSubject.error && preservedDocument.data?.subject_id === null);
  required(await a.from('documents').delete().eq('id', da.id).select('id'), 'DELETE_DOC');
  const cascade = await admin.from('document_summaries').select('id').eq('document_id', da.id);
  check('delete document cascades summaries', !cascade.error && cascade.data.length === 0);
  console.log(`FR_AUDIT_PROOF ${checks.filter(Boolean).length}/${checks.length}`);
  if (!checks.every(Boolean)) process.exitCode = 1;
} catch (error) { console.error(error instanceof Error ? error.message : 'PROOF_ERROR'); process.exitCode = 1; }
finally {
  if (paths.length) { const cleanup = await admin.storage.from('documents').remove(paths); if (cleanup.error) { console.error('CLEANUP_STORAGE_FAIL'); process.exitCode = 1; } }
  for (const id of users) { const cleanup = await admin.auth.admin.deleteUser(id); if (cleanup.error) { console.error('CLEANUP_USER_FAIL'); process.exitCode = 1; } }
}
