// node --env-file=.env --env-file=.env.local scripts/fr15-extraction-proof.mjs
// Dữ liệu/tài khoản tạm theo khuôn fr-audit-proof; không in credentials.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

const e = process.env;
if (!e.EXPO_PUBLIC_SUPABASE_URL || !e.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || !e.SUPABASE_SERVICE_ROLE_KEY) throw Error('MISSING_PROOF_ENV');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(e.EXPO_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, options);
const client = createClient(e.EXPO_PUBLIC_SUPABASE_URL, e.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'fr15-proof-'));
let userId, storagePath;
try {
  const suffix = randomUUID().slice(0, 8), email = `fr15-proof-${suffix}@example.com`, password = `Proof!${randomUUID()}`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true,
    user_metadata: { full_name: 'FR15 Proof', student_code: `FR15${suffix}` } });
  if (created.error || !created.data.user) throw Error('CREATE_USER_FAILED');
  userId = created.data.user.id;
  if ((await client.auth.signInWithPassword({ email, password })).error) throw Error('SIGN_IN_FAILED');

  // Chạy API thật của feature bằng client authenticated, không dùng admin để ghi kết quả.
  // Chỉ thay adapter Supabase/đường import để chạy TypeScript Expo trong Node.
  globalThis.fr15ProofClient = client;
  await fs.symlink(path.join(process.cwd(), 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  await fs.writeFile(path.join(temp, 'client.mjs'), 'export const supabase = globalThis.fr15ProofClient;');
  const files = { models: 'src/shared/ai/models.ts', transport: 'src/shared/ai/transport.ts',
    api: 'src/features/summary/api.ts', errors: 'src/features/summary/errors.ts', schemas: 'src/features/summary/schemas.ts', network: 'src/shared/lib/network.ts' };
  const imports = { './models': './models.mjs', '../../shared/ai/models': './models.mjs', '../../shared/ai/transport': './transport.mjs',
    '../../shared/lib/supabase': './client.mjs', '../../shared/lib/network': './network.mjs', './errors': './errors.mjs', './schemas': './schemas.mjs' };
  for (const [name, file] of Object.entries(files)) {
    let source = await fs.readFile(file, 'utf8');
    for (const [from, to] of Object.entries(imports)) source = source.replaceAll(`from '${from}'`, `from '${to}'`);
    await fs.writeFile(path.join(temp, `${name}.mjs`), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
  }
  const { requestSummary, getSummary } = await import(pathToFileURL(path.join(temp, 'api.mjs')).href);
  const bytes = await fs.readFile('scripts/fixtures/fr15-three-pages.pdf');
  storagePath = `${userId}/${randomUUID()}.pdf`;
  if ((await client.storage.from('documents').upload(storagePath, bytes, { contentType: 'application/pdf' })).error) throw Error('UPLOAD_FAILED');
  const inserted = await client.from('documents').insert({ user_id: userId, display_name: 'FR15 dữ liệu kiểm thử', file_ext: 'pdf',
    mime_type: 'application/pdf', file_size: bytes.length, storage_path: storagePath, extraction_status: 'pending' }).select('*').single();
  if (inserted.error || !inserted.data) throw Error('INSERT_DOCUMENT_FAILED');
  console.log('PASS authenticated PDF upload/document insert');
  const summary = await requestSummary({ document: inserted.data, userId, source: { kind: 'pdf', base64Data: bytes.toString('base64') },
    options: { level: 'short', scope: 'sections', sectionTitle: 'Chương 2' } });
  console.log('PASS production requestSummary -> Gemini -> Supabase');
  const reopened = await client.from('documents').select('extracted_text,extraction_status').eq('id', inserted.data.id).single();
  const normalize = (s) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
  const expected = (await fs.readFile('scripts/fixtures/fr15-three-pages.txt', 'utf8')).split('\n').filter(Boolean);
  if (reopened.error || reopened.data?.extraction_status !== 'done' || !expected.every((line) => normalize(reopened.data.extracted_text ?? '').includes(normalize(line)))) throw Error('PERSISTED_SOURCE_MISMATCH');
  console.log(`PASS refetch document: done, all ${expected.length} source paragraphs`);
  const history = await getSummary({ documentId: inserted.data.id, userId });
  if (history?.id !== summary.id || history?.summary_text !== summary.summary_text) throw Error('SUMMARY_REOPEN_MISMATCH');
  console.log('PASS production getSummary reopens saved chapter-2 summary');
  console.log('FR15_PERSISTENCE_PROOF 4/4');
} catch (error) {
  console.error(error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : 'FR15_PROOF_FAILED');
  process.exitCode = 1;
} finally {
  // Chỉ dọn tài khoản/object vừa tạo trong lần chạy này. Xóa user CASCADE các row thử.
  let storageClean = true;
  if (storagePath) storageClean = !(await admin.storage.from('documents').remove([storagePath])).error;
  if (!storageClean) { console.error('CLEANUP_STORAGE_FAILED'); process.exitCode = 1; }
  else if (userId) {
    const cleanup = await admin.auth.admin.deleteUser(userId);
    if (cleanup.error) { console.error('CLEANUP_USER_FAILED'); process.exitCode = 1; }
    else console.log('PASS cleanup temporary Storage/user/database rows');
  }
  await client.auth.signOut();
  delete globalThis.fr15ProofClient;
  await fs.rm(temp, { recursive: true, force: true });
}
